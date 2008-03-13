require("utils.js");

var user_variables = new string_hashmap();

function define_user_variable(name, default_value, doc) {
    conkeror[name] = default_value;
    user_variables.put(name, {
        default_value: default_value,
        doc: doc,
        shortdoc: get_shortdoc_string(doc),
        source_code_reference: get_caller_source_code_reference() });
}
