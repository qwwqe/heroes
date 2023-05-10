import Ajv from "ajv";
import addFormats from "ajv-formats";

interface JsonSchemaWithId {
  $id: string;
}

// 注入JSON Schema的各種格式支援。
const ajv = addFormats(new Ajv());

/**
 * 回傳對應schema的驗證器。如果schema尚未註冊過，則先編譯再回傳。
 */
function Validator<T>(schema: JsonSchemaWithId) {
  return ajv.getSchema<T>(schema.$id) || ajv.compile<T>(schema);
}

// type NoResult<T extends (...a: any) => any> = (...a: Parameters<T>) => void;
// type SchemaRegistration<T> = NoResult<typeof Validator<T>>;

/**
 * 綁定schema和類型參數。
 *
 * @remarks
 * 實作和{@link Validator}一模一樣。為了易讀性以及日後重構的便利，
 * 才用別名匯出。
 */
export const RegisterSchema = Validator;

export default Validator;
