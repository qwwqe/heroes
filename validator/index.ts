import Ajv from "ajv";
import addFormats from "ajv-formats";

interface JsonSchemaWithId {
  $id: string;
}

const ajv = addFormats(new Ajv());

function validator<T>(schema: JsonSchemaWithId) {
  return ajv.getSchema<T>(schema.$id) || ajv.compile<T>(schema);
}

export default validator;
