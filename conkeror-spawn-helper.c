/**
 * (C) Copyright 2008 Jeremy Maitin-Shepard
 *
 * Use, modification, and distribution are subject to the terms specified in the
 * COPYING file.
 **/

#include <sys/types.h>
#include <sys/socket.h>
#include <unistd.h>
#include <stdio.h>
#include <errno.h>
#include <stdlib.h>
#include <signal.h>
#include <sys/wait.h>
#include <sys/stat.h>
#include <string.h>
#include <fcntl.h>
#include <netinet/in.h>
#include <dirent.h>
#include <sys/resource.h>

void fail(const char *msg) {
  fprintf(stderr, "%s\n", msg);
  exit(1);
}

void failerr(const char *msg) {
  perror(msg);
  exit(1);
}

#define TRY(var, foo) var = foo; while (var == -1) { if(errno != EINTR) failerr(#foo); }

void *Malloc(size_t count) { void *r = malloc(count); if (!r) fail("malloc"); return r; }

/**
 * read_all: read from the specified file descriptor, returning a
 * malloc-allocated buffer containing the data that was read; the
 * number of bytes read is stored in *bytes_read.  If max_bytes is
 * non-negative, it specifies the maximum number of bytes to read.
 * Otherwise, read_all reads from the file descriptor until the end of
 * file is reached.
 */
char *read_all(int fd, int max_bytes, int *bytes_read) {
  int capacity = 256;
  if (max_bytes > 0)
    capacity = max_bytes;
  char *buffer = Malloc(capacity);
  int count = 0;
  if (max_bytes < 0 || max_bytes > 0) {
    while (1) {
      int remain;
      if (count == capacity) {
        capacity *= 2;
        buffer = realloc(buffer, capacity);
        if (!buffer)
          fail("realloc failed");
      }
      remain = capacity - count;
      if (max_bytes > 0 && remain > max_bytes)
        remain = max_bytes;
      TRY(remain, read(fd, buffer + count, remain));
      count += remain;
      if (remain == 0 || count == max_bytes)
        break;
    }
  }
  *bytes_read = count;
  return buffer;
}

/**
 * next_term: return the next NUL terminated string from buffer, and
 * adjust buffer and len accordingly.
 */
char *next_term(char **buffer, int *len) {
  char *p = *buffer;
  int x = 0;
  int max_len = *len;
  while (x < max_len && p[x])
    ++x;
  if (x == max_len)
    fail("error parsing");
  *buffer += x + 1;
  *len -= (x + 1);
  return p;
}

struct fd_info {
  int desired_fd;
  int orig_fd;
  char *path;
  int open_mode;
  int perms;
};

void write_all(int fd, const char *buf, int len) {
  int result;
  do {
    TRY(result, write(fd, buf, len));
    buf += result;
    len -= result;
  } while (len > 0);
}

/**
 * my_connect: Create a connection to the local Conkeror process on
 * the specified TCP port.  After connecting, the properly formatted
 * header specifying the client_key and the "role" (file descriptor or
 * -1 to indicate the control socket) are sent as well.  The file
 * descriptor for the socket is returned.
 */
int my_connect(int port, char *client_key, int role) {
  int sockfd;
  int result;
  struct sockaddr_in sa;

  TRY(sockfd, socket(PF_INET, SOCK_STREAM, 0));
  sa.sin_family = AF_INET;
  sa.sin_port = htons(port);
  sa.sin_addr.s_addr = inet_addr("127.0.0.1");
  memset(sa.sin_zero, 0, sizeof(sa.sin_zero));

  TRY(result, connect(sockfd, (struct sockaddr *)&sa, sizeof(sa)));

  /* Send the client key */
  write_all(sockfd, client_key, strlen(client_key));

  /* Send the role */
  if (role < 0) {
    write_all(sockfd, "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0", 15);
  }
  else {
    char buf[16];
    snprintf(buf, 16, "%15d", role);
    write_all(sockfd, buf, 15);
  }

  return sockfd;
}

int child_pid = 0;
int control_fd;

/**
 * sigchld_handler: reap any waitable children.  Once the child
 * process exits, send the exit status back over the control socket,
 * then exit. */
void sigchld_handler(int sig) {
  int status;
  int pid;
  int err;

  while (1) {
    pid = waitpid(-1, &status, WNOHANG);
    if (pid == 0)
      return;
    if (pid == -1) {
      if (errno == ECHILD)
        break;
      failerr("waitpid");
    }

    /* Our child process exited */
    if (pid == child_pid && (WIFEXITED(status) || WIFSIGNALED(status))) {
      char buf[30];
      snprintf(buf, 30, "%d", status);
      write_all(control_fd, buf, strlen(buf) + 1);
      exit(0);
    }
  }
}

void check_duplicate_fds(struct fd_info *fds, int fd_count) {
  int i, j;
  for (i = 0; i < fd_count; ++i) {
    for (j = i + 1; j < fd_count; ++j) {
      if (fds[i].desired_fd == fds[j].desired_fd)
        fail("duplicate redirection requested");
    }
  }
}

/**
 * setup_fds: Make the requested redirections.  For each entry in the
 * fds array, rename orig_fd to desired_fd.
 */
void setup_fds(struct fd_info *fds, int fd_count) {
  int i, j, result;
  for (i = 0; i < fd_count; ++i) {
    int fd = fds[i].desired_fd;
    /* Check if this file descriptor is still in use by any subsequent
       redirection. */
    for (j = i + 1; j < fd_count; ++j) {
      if (fd == fds[j].orig_fd) {
        /* It is in use.  Pick a new file descriptor for fds[j]. */
        int fd_new;
        TRY(fd_new, dup(fds[j].orig_fd));
        close(fds[j].orig_fd);
        fds[j].orig_fd = fd_new;
        break;
      }
    }
    TRY(result, dup2(fds[i].orig_fd, fd));
    close(fds[i].orig_fd);
  }
}

int main(int argc, char **argv) {

  int port;
  char *client_key, *server_key, *executable, *workdir;
  char **my_argv;
  struct fd_info *fds;
  int fd_count;
  int i;
  sigset_t my_mask, my_old_mask;

  if (argc != 3 || (port = atoi(argv[2])) == 0)
    fail("Invalid arguments");

  sigemptyset(&my_mask);
  sigaddset(&my_mask, SIGCHLD);

  /* Block SIGPIPE to avoid a signal being generated while writing to a socket */
  signal(SIGPIPE, SIG_IGN);

  /* Close everything except STDERR.  Mozilla leaves us with a bunch
     of junk file descriptors. */
  {
    DIR *dir = opendir("/proc/self/fd");
    if (!dir) {
      /* No proc filesystem available, just loop through file descriptors */
      struct rlimit file_lim;
      int max_fileno = 1024;
      if (getrlimit(RLIMIT_NOFILE, &file_lim) == 0)
        max_fileno = file_lim.rlim_cur;
      for (i = 0; i < max_fileno; ++i) {
        if (i == STDERR_FILENO)
          continue;
        close(i);
      }
    } else {
      struct dirent *dir_ent;
      int dir_fd = dirfd(dir);
      while ((dir_ent = readdir(dir)) != NULL) {
        int file_desc = atoi(dir_ent->d_name);
        if (file_desc == STDERR_FILENO || file_desc == dir_fd)
          continue;
        close(file_desc);
      }
      closedir(dir);
    }
  }

  /* Parse key file */
  {
    char *buf;
    int len;
    int my_argc;
    /* Read the entire file into buf. */
    {
      int file;
      TRY(file, open(argv[1], O_RDONLY));
      buf = read_all(file, -1, &len);
      close(file);

      /* Remove the temporary file */
      remove(argv[1]);
    }
    client_key = next_term(&buf, &len);
    server_key = next_term(&buf, &len);
    executable = next_term(&buf, &len);
    workdir = next_term(&buf, &len);
    my_argc = atoi(next_term(&buf, &len));
    my_argv = Malloc(sizeof(char *) * (my_argc + 1));
    for (i = 0; i < my_argc; ++i)
      my_argv[i] = next_term(&buf, &len);
    my_argv[my_argc] = NULL;
    fd_count = atoi(next_term(&buf, &len));
    if (fd_count < 0) fail("invalid fd count");
    fds = Malloc(sizeof(struct fd_info) * fd_count);
    for (i = 0; i < fd_count; ++i) {
      fds[i].desired_fd = atoi(next_term(&buf, &len));
      fds[i].path = next_term(&buf, &len);
      if (fds[i].path[0]) {
        fds[i].open_mode = atoi(next_term(&buf, &len));
        fds[i].perms = atoi(next_term(&buf, &len));
      }
    }
    if (len != 0)
      fail("invalid input file");
  }

  /* Validate the file descriptor redirection request. */
  check_duplicate_fds(fds, fd_count);

  /* Create the control socket connection. */
  control_fd = my_connect(port, client_key, -1);

  /* Create a socket connection or open a local file for each
     requested file descriptor redirection. */
  for (i = 0; i < fd_count; ++i) {
    if (fds[i].path[0]) {
      TRY(fds[i].orig_fd, open(fds[i].path, fds[i].open_mode, fds[i].perms));
    } else {
      fds[i].orig_fd = my_connect(port, client_key, fds[i].desired_fd);
    }
  }

  /* Check server key */
  {
    int len = strlen(server_key);
    int read_len;
    char *buf = read_all(control_fd, len, &read_len);
    if (len != read_len || memcmp(buf, server_key, len) != 0)
      fail("server key mismatch");
    free(buf);
  }

  /* Block SIGCHLD */
  sigprocmask(SIG_BLOCK, &my_mask, &my_old_mask);

  /* Create the child process */
  child_pid = fork();
  if (child_pid == 0) {
    int result;
    /* Unblock SIGCHLD */
    sigprocmask(SIG_SETMASK, &my_old_mask, NULL);

    /* Reset the SIGPIPE signal handler. */
    signal(SIGPIPE, SIG_DFL);

    /* Close the control socket, as it isn't needed from the child. */
    close(control_fd);

    /* Change to the specified working directory. */
    if (workdir[0] != 0) {
      if (chdir(workdir) == -1)
        failerr(workdir);
    }

    /* Rearrange file descriptors according to the user specification */
    setup_fds(fds, fd_count);

    /* Exec */
    TRY(result, execv(executable, my_argv));

  } else if (child_pid == -1) {
    failerr("fork");
  } else {
    /* We are in the parent process */
    char msg;
    int count;

    /* Install SIGCHLD handler */
    {
      struct sigaction act;
      act.sa_handler = sigchld_handler;
      sigemptyset(&act.sa_mask);
      act.sa_flags = SA_NOCLDSTOP;
      sigaction(SIGCHLD, &act, NULL);
    }
    /* Unblock SIGCHLD */
    sigprocmask(SIG_SETMASK, &my_old_mask, NULL);

    /* Close all of the redirection file descriptors, as we don't need
       them from the parent. */
    for (i = 0; i < fd_count; ++i)
      close(fds[i].orig_fd);

    /* Wait for a message from the server telling us to exit early. */
    TRY(count, read(control_fd, &msg, 1));

    if (count == 0) {
      /* End of file received: exit without killing child */
      return 0;
    }

    /* Assume msg == 0 until we support more messages */
    TRY(count, kill(child_pid, SIGTERM));
    return 0;
  }
}
