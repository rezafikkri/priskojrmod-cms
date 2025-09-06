
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model SecretKeyLicense
 * 
 */
export type SecretKeyLicense = $Result.DefaultSelection<Prisma.$SecretKeyLicensePayload>
/**
 * Model LicenseKey
 * 
 */
export type LicenseKey = $Result.DefaultSelection<Prisma.$LicenseKeyPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more SecretKeyLicenses
 * const secretKeyLicenses = await prisma.secretKeyLicense.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more SecretKeyLicenses
   * const secretKeyLicenses = await prisma.secretKeyLicense.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.secretKeyLicense`: Exposes CRUD operations for the **SecretKeyLicense** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SecretKeyLicenses
    * const secretKeyLicenses = await prisma.secretKeyLicense.findMany()
    * ```
    */
  get secretKeyLicense(): Prisma.SecretKeyLicenseDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.licenseKey`: Exposes CRUD operations for the **LicenseKey** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LicenseKeys
    * const licenseKeys = await prisma.licenseKey.findMany()
    * ```
    */
  get licenseKey(): Prisma.LicenseKeyDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.8.2
   * Query Engine version: 2060c79ba17c6bb9f5823312b6f6b7f4a845738e
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    SecretKeyLicense: 'SecretKeyLicense',
    LicenseKey: 'LicenseKey'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "secretKeyLicense" | "licenseKey"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      SecretKeyLicense: {
        payload: Prisma.$SecretKeyLicensePayload<ExtArgs>
        fields: Prisma.SecretKeyLicenseFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SecretKeyLicenseFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretKeyLicensePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SecretKeyLicenseFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretKeyLicensePayload>
          }
          findFirst: {
            args: Prisma.SecretKeyLicenseFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretKeyLicensePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SecretKeyLicenseFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretKeyLicensePayload>
          }
          findMany: {
            args: Prisma.SecretKeyLicenseFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretKeyLicensePayload>[]
          }
          create: {
            args: Prisma.SecretKeyLicenseCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretKeyLicensePayload>
          }
          createMany: {
            args: Prisma.SecretKeyLicenseCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SecretKeyLicenseCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretKeyLicensePayload>[]
          }
          delete: {
            args: Prisma.SecretKeyLicenseDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretKeyLicensePayload>
          }
          update: {
            args: Prisma.SecretKeyLicenseUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretKeyLicensePayload>
          }
          deleteMany: {
            args: Prisma.SecretKeyLicenseDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SecretKeyLicenseUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SecretKeyLicenseUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretKeyLicensePayload>[]
          }
          upsert: {
            args: Prisma.SecretKeyLicenseUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SecretKeyLicensePayload>
          }
          aggregate: {
            args: Prisma.SecretKeyLicenseAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSecretKeyLicense>
          }
          groupBy: {
            args: Prisma.SecretKeyLicenseGroupByArgs<ExtArgs>
            result: $Utils.Optional<SecretKeyLicenseGroupByOutputType>[]
          }
          count: {
            args: Prisma.SecretKeyLicenseCountArgs<ExtArgs>
            result: $Utils.Optional<SecretKeyLicenseCountAggregateOutputType> | number
          }
        }
      }
      LicenseKey: {
        payload: Prisma.$LicenseKeyPayload<ExtArgs>
        fields: Prisma.LicenseKeyFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LicenseKeyFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LicenseKeyPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LicenseKeyFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LicenseKeyPayload>
          }
          findFirst: {
            args: Prisma.LicenseKeyFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LicenseKeyPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LicenseKeyFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LicenseKeyPayload>
          }
          findMany: {
            args: Prisma.LicenseKeyFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LicenseKeyPayload>[]
          }
          create: {
            args: Prisma.LicenseKeyCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LicenseKeyPayload>
          }
          createMany: {
            args: Prisma.LicenseKeyCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LicenseKeyCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LicenseKeyPayload>[]
          }
          delete: {
            args: Prisma.LicenseKeyDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LicenseKeyPayload>
          }
          update: {
            args: Prisma.LicenseKeyUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LicenseKeyPayload>
          }
          deleteMany: {
            args: Prisma.LicenseKeyDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LicenseKeyUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LicenseKeyUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LicenseKeyPayload>[]
          }
          upsert: {
            args: Prisma.LicenseKeyUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LicenseKeyPayload>
          }
          aggregate: {
            args: Prisma.LicenseKeyAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLicenseKey>
          }
          groupBy: {
            args: Prisma.LicenseKeyGroupByArgs<ExtArgs>
            result: $Utils.Optional<LicenseKeyGroupByOutputType>[]
          }
          count: {
            args: Prisma.LicenseKeyCountArgs<ExtArgs>
            result: $Utils.Optional<LicenseKeyCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    secretKeyLicense?: SecretKeyLicenseOmit
    licenseKey?: LicenseKeyOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type SecretKeyLicenseCountOutputType
   */

  export type SecretKeyLicenseCountOutputType = {
    license_key: number
  }

  export type SecretKeyLicenseCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    license_key?: boolean | SecretKeyLicenseCountOutputTypeCountLicense_keyArgs
  }

  // Custom InputTypes
  /**
   * SecretKeyLicenseCountOutputType without action
   */
  export type SecretKeyLicenseCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretKeyLicenseCountOutputType
     */
    select?: SecretKeyLicenseCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SecretKeyLicenseCountOutputType without action
   */
  export type SecretKeyLicenseCountOutputTypeCountLicense_keyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LicenseKeyWhereInput
  }


  /**
   * Models
   */

  /**
   * Model SecretKeyLicense
   */

  export type AggregateSecretKeyLicense = {
    _count: SecretKeyLicenseCountAggregateOutputType | null
    _avg: SecretKeyLicenseAvgAggregateOutputType | null
    _sum: SecretKeyLicenseSumAggregateOutputType | null
    _min: SecretKeyLicenseMinAggregateOutputType | null
    _max: SecretKeyLicenseMaxAggregateOutputType | null
  }

  export type SecretKeyLicenseAvgAggregateOutputType = {
    id: number | null
    created_at: number | null
    regenerated_at: number | null
  }

  export type SecretKeyLicenseSumAggregateOutputType = {
    id: bigint | null
    created_at: bigint | null
    regenerated_at: bigint | null
  }

  export type SecretKeyLicenseMinAggregateOutputType = {
    id: bigint | null
    product_id: string | null
    key: string | null
    app_name: string | null
    created_at: bigint | null
    regenerated_at: bigint | null
  }

  export type SecretKeyLicenseMaxAggregateOutputType = {
    id: bigint | null
    product_id: string | null
    key: string | null
    app_name: string | null
    created_at: bigint | null
    regenerated_at: bigint | null
  }

  export type SecretKeyLicenseCountAggregateOutputType = {
    id: number
    product_id: number
    key: number
    app_name: number
    created_at: number
    regenerated_at: number
    _all: number
  }


  export type SecretKeyLicenseAvgAggregateInputType = {
    id?: true
    created_at?: true
    regenerated_at?: true
  }

  export type SecretKeyLicenseSumAggregateInputType = {
    id?: true
    created_at?: true
    regenerated_at?: true
  }

  export type SecretKeyLicenseMinAggregateInputType = {
    id?: true
    product_id?: true
    key?: true
    app_name?: true
    created_at?: true
    regenerated_at?: true
  }

  export type SecretKeyLicenseMaxAggregateInputType = {
    id?: true
    product_id?: true
    key?: true
    app_name?: true
    created_at?: true
    regenerated_at?: true
  }

  export type SecretKeyLicenseCountAggregateInputType = {
    id?: true
    product_id?: true
    key?: true
    app_name?: true
    created_at?: true
    regenerated_at?: true
    _all?: true
  }

  export type SecretKeyLicenseAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SecretKeyLicense to aggregate.
     */
    where?: SecretKeyLicenseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SecretKeyLicenses to fetch.
     */
    orderBy?: SecretKeyLicenseOrderByWithRelationInput | SecretKeyLicenseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SecretKeyLicenseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SecretKeyLicenses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SecretKeyLicenses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SecretKeyLicenses
    **/
    _count?: true | SecretKeyLicenseCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SecretKeyLicenseAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SecretKeyLicenseSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SecretKeyLicenseMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SecretKeyLicenseMaxAggregateInputType
  }

  export type GetSecretKeyLicenseAggregateType<T extends SecretKeyLicenseAggregateArgs> = {
        [P in keyof T & keyof AggregateSecretKeyLicense]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSecretKeyLicense[P]>
      : GetScalarType<T[P], AggregateSecretKeyLicense[P]>
  }




  export type SecretKeyLicenseGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SecretKeyLicenseWhereInput
    orderBy?: SecretKeyLicenseOrderByWithAggregationInput | SecretKeyLicenseOrderByWithAggregationInput[]
    by: SecretKeyLicenseScalarFieldEnum[] | SecretKeyLicenseScalarFieldEnum
    having?: SecretKeyLicenseScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SecretKeyLicenseCountAggregateInputType | true
    _avg?: SecretKeyLicenseAvgAggregateInputType
    _sum?: SecretKeyLicenseSumAggregateInputType
    _min?: SecretKeyLicenseMinAggregateInputType
    _max?: SecretKeyLicenseMaxAggregateInputType
  }

  export type SecretKeyLicenseGroupByOutputType = {
    id: bigint
    product_id: string
    key: string
    app_name: string
    created_at: bigint
    regenerated_at: bigint | null
    _count: SecretKeyLicenseCountAggregateOutputType | null
    _avg: SecretKeyLicenseAvgAggregateOutputType | null
    _sum: SecretKeyLicenseSumAggregateOutputType | null
    _min: SecretKeyLicenseMinAggregateOutputType | null
    _max: SecretKeyLicenseMaxAggregateOutputType | null
  }

  type GetSecretKeyLicenseGroupByPayload<T extends SecretKeyLicenseGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SecretKeyLicenseGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SecretKeyLicenseGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SecretKeyLicenseGroupByOutputType[P]>
            : GetScalarType<T[P], SecretKeyLicenseGroupByOutputType[P]>
        }
      >
    >


  export type SecretKeyLicenseSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    product_id?: boolean
    key?: boolean
    app_name?: boolean
    created_at?: boolean
    regenerated_at?: boolean
    license_key?: boolean | SecretKeyLicense$license_keyArgs<ExtArgs>
    _count?: boolean | SecretKeyLicenseCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["secretKeyLicense"]>

  export type SecretKeyLicenseSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    product_id?: boolean
    key?: boolean
    app_name?: boolean
    created_at?: boolean
    regenerated_at?: boolean
  }, ExtArgs["result"]["secretKeyLicense"]>

  export type SecretKeyLicenseSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    product_id?: boolean
    key?: boolean
    app_name?: boolean
    created_at?: boolean
    regenerated_at?: boolean
  }, ExtArgs["result"]["secretKeyLicense"]>

  export type SecretKeyLicenseSelectScalar = {
    id?: boolean
    product_id?: boolean
    key?: boolean
    app_name?: boolean
    created_at?: boolean
    regenerated_at?: boolean
  }

  export type SecretKeyLicenseOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "product_id" | "key" | "app_name" | "created_at" | "regenerated_at", ExtArgs["result"]["secretKeyLicense"]>
  export type SecretKeyLicenseInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    license_key?: boolean | SecretKeyLicense$license_keyArgs<ExtArgs>
    _count?: boolean | SecretKeyLicenseCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SecretKeyLicenseIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type SecretKeyLicenseIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $SecretKeyLicensePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SecretKeyLicense"
    objects: {
      license_key: Prisma.$LicenseKeyPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      product_id: string
      key: string
      app_name: string
      created_at: bigint
      regenerated_at: bigint | null
    }, ExtArgs["result"]["secretKeyLicense"]>
    composites: {}
  }

  type SecretKeyLicenseGetPayload<S extends boolean | null | undefined | SecretKeyLicenseDefaultArgs> = $Result.GetResult<Prisma.$SecretKeyLicensePayload, S>

  type SecretKeyLicenseCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SecretKeyLicenseFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SecretKeyLicenseCountAggregateInputType | true
    }

  export interface SecretKeyLicenseDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SecretKeyLicense'], meta: { name: 'SecretKeyLicense' } }
    /**
     * Find zero or one SecretKeyLicense that matches the filter.
     * @param {SecretKeyLicenseFindUniqueArgs} args - Arguments to find a SecretKeyLicense
     * @example
     * // Get one SecretKeyLicense
     * const secretKeyLicense = await prisma.secretKeyLicense.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SecretKeyLicenseFindUniqueArgs>(args: SelectSubset<T, SecretKeyLicenseFindUniqueArgs<ExtArgs>>): Prisma__SecretKeyLicenseClient<$Result.GetResult<Prisma.$SecretKeyLicensePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SecretKeyLicense that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SecretKeyLicenseFindUniqueOrThrowArgs} args - Arguments to find a SecretKeyLicense
     * @example
     * // Get one SecretKeyLicense
     * const secretKeyLicense = await prisma.secretKeyLicense.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SecretKeyLicenseFindUniqueOrThrowArgs>(args: SelectSubset<T, SecretKeyLicenseFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SecretKeyLicenseClient<$Result.GetResult<Prisma.$SecretKeyLicensePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SecretKeyLicense that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretKeyLicenseFindFirstArgs} args - Arguments to find a SecretKeyLicense
     * @example
     * // Get one SecretKeyLicense
     * const secretKeyLicense = await prisma.secretKeyLicense.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SecretKeyLicenseFindFirstArgs>(args?: SelectSubset<T, SecretKeyLicenseFindFirstArgs<ExtArgs>>): Prisma__SecretKeyLicenseClient<$Result.GetResult<Prisma.$SecretKeyLicensePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SecretKeyLicense that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretKeyLicenseFindFirstOrThrowArgs} args - Arguments to find a SecretKeyLicense
     * @example
     * // Get one SecretKeyLicense
     * const secretKeyLicense = await prisma.secretKeyLicense.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SecretKeyLicenseFindFirstOrThrowArgs>(args?: SelectSubset<T, SecretKeyLicenseFindFirstOrThrowArgs<ExtArgs>>): Prisma__SecretKeyLicenseClient<$Result.GetResult<Prisma.$SecretKeyLicensePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SecretKeyLicenses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretKeyLicenseFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SecretKeyLicenses
     * const secretKeyLicenses = await prisma.secretKeyLicense.findMany()
     * 
     * // Get first 10 SecretKeyLicenses
     * const secretKeyLicenses = await prisma.secretKeyLicense.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const secretKeyLicenseWithIdOnly = await prisma.secretKeyLicense.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SecretKeyLicenseFindManyArgs>(args?: SelectSubset<T, SecretKeyLicenseFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SecretKeyLicensePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SecretKeyLicense.
     * @param {SecretKeyLicenseCreateArgs} args - Arguments to create a SecretKeyLicense.
     * @example
     * // Create one SecretKeyLicense
     * const SecretKeyLicense = await prisma.secretKeyLicense.create({
     *   data: {
     *     // ... data to create a SecretKeyLicense
     *   }
     * })
     * 
     */
    create<T extends SecretKeyLicenseCreateArgs>(args: SelectSubset<T, SecretKeyLicenseCreateArgs<ExtArgs>>): Prisma__SecretKeyLicenseClient<$Result.GetResult<Prisma.$SecretKeyLicensePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SecretKeyLicenses.
     * @param {SecretKeyLicenseCreateManyArgs} args - Arguments to create many SecretKeyLicenses.
     * @example
     * // Create many SecretKeyLicenses
     * const secretKeyLicense = await prisma.secretKeyLicense.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SecretKeyLicenseCreateManyArgs>(args?: SelectSubset<T, SecretKeyLicenseCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SecretKeyLicenses and returns the data saved in the database.
     * @param {SecretKeyLicenseCreateManyAndReturnArgs} args - Arguments to create many SecretKeyLicenses.
     * @example
     * // Create many SecretKeyLicenses
     * const secretKeyLicense = await prisma.secretKeyLicense.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SecretKeyLicenses and only return the `id`
     * const secretKeyLicenseWithIdOnly = await prisma.secretKeyLicense.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SecretKeyLicenseCreateManyAndReturnArgs>(args?: SelectSubset<T, SecretKeyLicenseCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SecretKeyLicensePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SecretKeyLicense.
     * @param {SecretKeyLicenseDeleteArgs} args - Arguments to delete one SecretKeyLicense.
     * @example
     * // Delete one SecretKeyLicense
     * const SecretKeyLicense = await prisma.secretKeyLicense.delete({
     *   where: {
     *     // ... filter to delete one SecretKeyLicense
     *   }
     * })
     * 
     */
    delete<T extends SecretKeyLicenseDeleteArgs>(args: SelectSubset<T, SecretKeyLicenseDeleteArgs<ExtArgs>>): Prisma__SecretKeyLicenseClient<$Result.GetResult<Prisma.$SecretKeyLicensePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SecretKeyLicense.
     * @param {SecretKeyLicenseUpdateArgs} args - Arguments to update one SecretKeyLicense.
     * @example
     * // Update one SecretKeyLicense
     * const secretKeyLicense = await prisma.secretKeyLicense.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SecretKeyLicenseUpdateArgs>(args: SelectSubset<T, SecretKeyLicenseUpdateArgs<ExtArgs>>): Prisma__SecretKeyLicenseClient<$Result.GetResult<Prisma.$SecretKeyLicensePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SecretKeyLicenses.
     * @param {SecretKeyLicenseDeleteManyArgs} args - Arguments to filter SecretKeyLicenses to delete.
     * @example
     * // Delete a few SecretKeyLicenses
     * const { count } = await prisma.secretKeyLicense.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SecretKeyLicenseDeleteManyArgs>(args?: SelectSubset<T, SecretKeyLicenseDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SecretKeyLicenses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretKeyLicenseUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SecretKeyLicenses
     * const secretKeyLicense = await prisma.secretKeyLicense.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SecretKeyLicenseUpdateManyArgs>(args: SelectSubset<T, SecretKeyLicenseUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SecretKeyLicenses and returns the data updated in the database.
     * @param {SecretKeyLicenseUpdateManyAndReturnArgs} args - Arguments to update many SecretKeyLicenses.
     * @example
     * // Update many SecretKeyLicenses
     * const secretKeyLicense = await prisma.secretKeyLicense.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SecretKeyLicenses and only return the `id`
     * const secretKeyLicenseWithIdOnly = await prisma.secretKeyLicense.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SecretKeyLicenseUpdateManyAndReturnArgs>(args: SelectSubset<T, SecretKeyLicenseUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SecretKeyLicensePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SecretKeyLicense.
     * @param {SecretKeyLicenseUpsertArgs} args - Arguments to update or create a SecretKeyLicense.
     * @example
     * // Update or create a SecretKeyLicense
     * const secretKeyLicense = await prisma.secretKeyLicense.upsert({
     *   create: {
     *     // ... data to create a SecretKeyLicense
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SecretKeyLicense we want to update
     *   }
     * })
     */
    upsert<T extends SecretKeyLicenseUpsertArgs>(args: SelectSubset<T, SecretKeyLicenseUpsertArgs<ExtArgs>>): Prisma__SecretKeyLicenseClient<$Result.GetResult<Prisma.$SecretKeyLicensePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SecretKeyLicenses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretKeyLicenseCountArgs} args - Arguments to filter SecretKeyLicenses to count.
     * @example
     * // Count the number of SecretKeyLicenses
     * const count = await prisma.secretKeyLicense.count({
     *   where: {
     *     // ... the filter for the SecretKeyLicenses we want to count
     *   }
     * })
    **/
    count<T extends SecretKeyLicenseCountArgs>(
      args?: Subset<T, SecretKeyLicenseCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SecretKeyLicenseCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SecretKeyLicense.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretKeyLicenseAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SecretKeyLicenseAggregateArgs>(args: Subset<T, SecretKeyLicenseAggregateArgs>): Prisma.PrismaPromise<GetSecretKeyLicenseAggregateType<T>>

    /**
     * Group by SecretKeyLicense.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SecretKeyLicenseGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SecretKeyLicenseGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SecretKeyLicenseGroupByArgs['orderBy'] }
        : { orderBy?: SecretKeyLicenseGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SecretKeyLicenseGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSecretKeyLicenseGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SecretKeyLicense model
   */
  readonly fields: SecretKeyLicenseFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SecretKeyLicense.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SecretKeyLicenseClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    license_key<T extends SecretKeyLicense$license_keyArgs<ExtArgs> = {}>(args?: Subset<T, SecretKeyLicense$license_keyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LicenseKeyPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SecretKeyLicense model
   */
  interface SecretKeyLicenseFieldRefs {
    readonly id: FieldRef<"SecretKeyLicense", 'BigInt'>
    readonly product_id: FieldRef<"SecretKeyLicense", 'String'>
    readonly key: FieldRef<"SecretKeyLicense", 'String'>
    readonly app_name: FieldRef<"SecretKeyLicense", 'String'>
    readonly created_at: FieldRef<"SecretKeyLicense", 'BigInt'>
    readonly regenerated_at: FieldRef<"SecretKeyLicense", 'BigInt'>
  }
    

  // Custom InputTypes
  /**
   * SecretKeyLicense findUnique
   */
  export type SecretKeyLicenseFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretKeyLicense
     */
    select?: SecretKeyLicenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretKeyLicense
     */
    omit?: SecretKeyLicenseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecretKeyLicenseInclude<ExtArgs> | null
    /**
     * Filter, which SecretKeyLicense to fetch.
     */
    where: SecretKeyLicenseWhereUniqueInput
  }

  /**
   * SecretKeyLicense findUniqueOrThrow
   */
  export type SecretKeyLicenseFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretKeyLicense
     */
    select?: SecretKeyLicenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretKeyLicense
     */
    omit?: SecretKeyLicenseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecretKeyLicenseInclude<ExtArgs> | null
    /**
     * Filter, which SecretKeyLicense to fetch.
     */
    where: SecretKeyLicenseWhereUniqueInput
  }

  /**
   * SecretKeyLicense findFirst
   */
  export type SecretKeyLicenseFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretKeyLicense
     */
    select?: SecretKeyLicenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretKeyLicense
     */
    omit?: SecretKeyLicenseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecretKeyLicenseInclude<ExtArgs> | null
    /**
     * Filter, which SecretKeyLicense to fetch.
     */
    where?: SecretKeyLicenseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SecretKeyLicenses to fetch.
     */
    orderBy?: SecretKeyLicenseOrderByWithRelationInput | SecretKeyLicenseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SecretKeyLicenses.
     */
    cursor?: SecretKeyLicenseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SecretKeyLicenses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SecretKeyLicenses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SecretKeyLicenses.
     */
    distinct?: SecretKeyLicenseScalarFieldEnum | SecretKeyLicenseScalarFieldEnum[]
  }

  /**
   * SecretKeyLicense findFirstOrThrow
   */
  export type SecretKeyLicenseFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretKeyLicense
     */
    select?: SecretKeyLicenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretKeyLicense
     */
    omit?: SecretKeyLicenseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecretKeyLicenseInclude<ExtArgs> | null
    /**
     * Filter, which SecretKeyLicense to fetch.
     */
    where?: SecretKeyLicenseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SecretKeyLicenses to fetch.
     */
    orderBy?: SecretKeyLicenseOrderByWithRelationInput | SecretKeyLicenseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SecretKeyLicenses.
     */
    cursor?: SecretKeyLicenseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SecretKeyLicenses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SecretKeyLicenses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SecretKeyLicenses.
     */
    distinct?: SecretKeyLicenseScalarFieldEnum | SecretKeyLicenseScalarFieldEnum[]
  }

  /**
   * SecretKeyLicense findMany
   */
  export type SecretKeyLicenseFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretKeyLicense
     */
    select?: SecretKeyLicenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretKeyLicense
     */
    omit?: SecretKeyLicenseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecretKeyLicenseInclude<ExtArgs> | null
    /**
     * Filter, which SecretKeyLicenses to fetch.
     */
    where?: SecretKeyLicenseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SecretKeyLicenses to fetch.
     */
    orderBy?: SecretKeyLicenseOrderByWithRelationInput | SecretKeyLicenseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SecretKeyLicenses.
     */
    cursor?: SecretKeyLicenseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SecretKeyLicenses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SecretKeyLicenses.
     */
    skip?: number
    distinct?: SecretKeyLicenseScalarFieldEnum | SecretKeyLicenseScalarFieldEnum[]
  }

  /**
   * SecretKeyLicense create
   */
  export type SecretKeyLicenseCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretKeyLicense
     */
    select?: SecretKeyLicenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretKeyLicense
     */
    omit?: SecretKeyLicenseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecretKeyLicenseInclude<ExtArgs> | null
    /**
     * The data needed to create a SecretKeyLicense.
     */
    data: XOR<SecretKeyLicenseCreateInput, SecretKeyLicenseUncheckedCreateInput>
  }

  /**
   * SecretKeyLicense createMany
   */
  export type SecretKeyLicenseCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SecretKeyLicenses.
     */
    data: SecretKeyLicenseCreateManyInput | SecretKeyLicenseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SecretKeyLicense createManyAndReturn
   */
  export type SecretKeyLicenseCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretKeyLicense
     */
    select?: SecretKeyLicenseSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SecretKeyLicense
     */
    omit?: SecretKeyLicenseOmit<ExtArgs> | null
    /**
     * The data used to create many SecretKeyLicenses.
     */
    data: SecretKeyLicenseCreateManyInput | SecretKeyLicenseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SecretKeyLicense update
   */
  export type SecretKeyLicenseUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretKeyLicense
     */
    select?: SecretKeyLicenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretKeyLicense
     */
    omit?: SecretKeyLicenseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecretKeyLicenseInclude<ExtArgs> | null
    /**
     * The data needed to update a SecretKeyLicense.
     */
    data: XOR<SecretKeyLicenseUpdateInput, SecretKeyLicenseUncheckedUpdateInput>
    /**
     * Choose, which SecretKeyLicense to update.
     */
    where: SecretKeyLicenseWhereUniqueInput
  }

  /**
   * SecretKeyLicense updateMany
   */
  export type SecretKeyLicenseUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SecretKeyLicenses.
     */
    data: XOR<SecretKeyLicenseUpdateManyMutationInput, SecretKeyLicenseUncheckedUpdateManyInput>
    /**
     * Filter which SecretKeyLicenses to update
     */
    where?: SecretKeyLicenseWhereInput
    /**
     * Limit how many SecretKeyLicenses to update.
     */
    limit?: number
  }

  /**
   * SecretKeyLicense updateManyAndReturn
   */
  export type SecretKeyLicenseUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretKeyLicense
     */
    select?: SecretKeyLicenseSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SecretKeyLicense
     */
    omit?: SecretKeyLicenseOmit<ExtArgs> | null
    /**
     * The data used to update SecretKeyLicenses.
     */
    data: XOR<SecretKeyLicenseUpdateManyMutationInput, SecretKeyLicenseUncheckedUpdateManyInput>
    /**
     * Filter which SecretKeyLicenses to update
     */
    where?: SecretKeyLicenseWhereInput
    /**
     * Limit how many SecretKeyLicenses to update.
     */
    limit?: number
  }

  /**
   * SecretKeyLicense upsert
   */
  export type SecretKeyLicenseUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretKeyLicense
     */
    select?: SecretKeyLicenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretKeyLicense
     */
    omit?: SecretKeyLicenseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecretKeyLicenseInclude<ExtArgs> | null
    /**
     * The filter to search for the SecretKeyLicense to update in case it exists.
     */
    where: SecretKeyLicenseWhereUniqueInput
    /**
     * In case the SecretKeyLicense found by the `where` argument doesn't exist, create a new SecretKeyLicense with this data.
     */
    create: XOR<SecretKeyLicenseCreateInput, SecretKeyLicenseUncheckedCreateInput>
    /**
     * In case the SecretKeyLicense was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SecretKeyLicenseUpdateInput, SecretKeyLicenseUncheckedUpdateInput>
  }

  /**
   * SecretKeyLicense delete
   */
  export type SecretKeyLicenseDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretKeyLicense
     */
    select?: SecretKeyLicenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretKeyLicense
     */
    omit?: SecretKeyLicenseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecretKeyLicenseInclude<ExtArgs> | null
    /**
     * Filter which SecretKeyLicense to delete.
     */
    where: SecretKeyLicenseWhereUniqueInput
  }

  /**
   * SecretKeyLicense deleteMany
   */
  export type SecretKeyLicenseDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SecretKeyLicenses to delete
     */
    where?: SecretKeyLicenseWhereInput
    /**
     * Limit how many SecretKeyLicenses to delete.
     */
    limit?: number
  }

  /**
   * SecretKeyLicense.license_key
   */
  export type SecretKeyLicense$license_keyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LicenseKey
     */
    select?: LicenseKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LicenseKey
     */
    omit?: LicenseKeyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LicenseKeyInclude<ExtArgs> | null
    where?: LicenseKeyWhereInput
    orderBy?: LicenseKeyOrderByWithRelationInput | LicenseKeyOrderByWithRelationInput[]
    cursor?: LicenseKeyWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LicenseKeyScalarFieldEnum | LicenseKeyScalarFieldEnum[]
  }

  /**
   * SecretKeyLicense without action
   */
  export type SecretKeyLicenseDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SecretKeyLicense
     */
    select?: SecretKeyLicenseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SecretKeyLicense
     */
    omit?: SecretKeyLicenseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SecretKeyLicenseInclude<ExtArgs> | null
  }


  /**
   * Model LicenseKey
   */

  export type AggregateLicenseKey = {
    _count: LicenseKeyCountAggregateOutputType | null
    _avg: LicenseKeyAvgAggregateOutputType | null
    _sum: LicenseKeySumAggregateOutputType | null
    _min: LicenseKeyMinAggregateOutputType | null
    _max: LicenseKeyMaxAggregateOutputType | null
  }

  export type LicenseKeyAvgAggregateOutputType = {
    secret_key_id: number | null
    created_at: number | null
    updated_at: number | null
    regenerated_at: number | null
    reset_count: number | null
  }

  export type LicenseKeySumAggregateOutputType = {
    secret_key_id: bigint | null
    created_at: bigint | null
    updated_at: bigint | null
    regenerated_at: bigint | null
    reset_count: number | null
  }

  export type LicenseKeyMinAggregateOutputType = {
    id: string | null
    secret_key_id: bigint | null
    customer_id: string | null
    email: string | null
    code: string | null
    can_regenerate: boolean | null
    is_revoked: boolean | null
    created_at: bigint | null
    updated_at: bigint | null
    regenerated_at: bigint | null
    device_id: string | null
    last_reset_period: string | null
    reset_count: number | null
  }

  export type LicenseKeyMaxAggregateOutputType = {
    id: string | null
    secret_key_id: bigint | null
    customer_id: string | null
    email: string | null
    code: string | null
    can_regenerate: boolean | null
    is_revoked: boolean | null
    created_at: bigint | null
    updated_at: bigint | null
    regenerated_at: bigint | null
    device_id: string | null
    last_reset_period: string | null
    reset_count: number | null
  }

  export type LicenseKeyCountAggregateOutputType = {
    id: number
    secret_key_id: number
    customer_id: number
    email: number
    code: number
    can_regenerate: number
    is_revoked: number
    created_at: number
    updated_at: number
    regenerated_at: number
    device_id: number
    last_reset_period: number
    reset_count: number
    _all: number
  }


  export type LicenseKeyAvgAggregateInputType = {
    secret_key_id?: true
    created_at?: true
    updated_at?: true
    regenerated_at?: true
    reset_count?: true
  }

  export type LicenseKeySumAggregateInputType = {
    secret_key_id?: true
    created_at?: true
    updated_at?: true
    regenerated_at?: true
    reset_count?: true
  }

  export type LicenseKeyMinAggregateInputType = {
    id?: true
    secret_key_id?: true
    customer_id?: true
    email?: true
    code?: true
    can_regenerate?: true
    is_revoked?: true
    created_at?: true
    updated_at?: true
    regenerated_at?: true
    device_id?: true
    last_reset_period?: true
    reset_count?: true
  }

  export type LicenseKeyMaxAggregateInputType = {
    id?: true
    secret_key_id?: true
    customer_id?: true
    email?: true
    code?: true
    can_regenerate?: true
    is_revoked?: true
    created_at?: true
    updated_at?: true
    regenerated_at?: true
    device_id?: true
    last_reset_period?: true
    reset_count?: true
  }

  export type LicenseKeyCountAggregateInputType = {
    id?: true
    secret_key_id?: true
    customer_id?: true
    email?: true
    code?: true
    can_regenerate?: true
    is_revoked?: true
    created_at?: true
    updated_at?: true
    regenerated_at?: true
    device_id?: true
    last_reset_period?: true
    reset_count?: true
    _all?: true
  }

  export type LicenseKeyAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LicenseKey to aggregate.
     */
    where?: LicenseKeyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LicenseKeys to fetch.
     */
    orderBy?: LicenseKeyOrderByWithRelationInput | LicenseKeyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LicenseKeyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LicenseKeys from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LicenseKeys.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LicenseKeys
    **/
    _count?: true | LicenseKeyCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LicenseKeyAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LicenseKeySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LicenseKeyMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LicenseKeyMaxAggregateInputType
  }

  export type GetLicenseKeyAggregateType<T extends LicenseKeyAggregateArgs> = {
        [P in keyof T & keyof AggregateLicenseKey]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLicenseKey[P]>
      : GetScalarType<T[P], AggregateLicenseKey[P]>
  }




  export type LicenseKeyGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LicenseKeyWhereInput
    orderBy?: LicenseKeyOrderByWithAggregationInput | LicenseKeyOrderByWithAggregationInput[]
    by: LicenseKeyScalarFieldEnum[] | LicenseKeyScalarFieldEnum
    having?: LicenseKeyScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LicenseKeyCountAggregateInputType | true
    _avg?: LicenseKeyAvgAggregateInputType
    _sum?: LicenseKeySumAggregateInputType
    _min?: LicenseKeyMinAggregateInputType
    _max?: LicenseKeyMaxAggregateInputType
  }

  export type LicenseKeyGroupByOutputType = {
    id: string
    secret_key_id: bigint
    customer_id: string
    email: string
    code: string
    can_regenerate: boolean
    is_revoked: boolean
    created_at: bigint
    updated_at: bigint
    regenerated_at: bigint | null
    device_id: string | null
    last_reset_period: string | null
    reset_count: number
    _count: LicenseKeyCountAggregateOutputType | null
    _avg: LicenseKeyAvgAggregateOutputType | null
    _sum: LicenseKeySumAggregateOutputType | null
    _min: LicenseKeyMinAggregateOutputType | null
    _max: LicenseKeyMaxAggregateOutputType | null
  }

  type GetLicenseKeyGroupByPayload<T extends LicenseKeyGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LicenseKeyGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LicenseKeyGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LicenseKeyGroupByOutputType[P]>
            : GetScalarType<T[P], LicenseKeyGroupByOutputType[P]>
        }
      >
    >


  export type LicenseKeySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    secret_key_id?: boolean
    customer_id?: boolean
    email?: boolean
    code?: boolean
    can_regenerate?: boolean
    is_revoked?: boolean
    created_at?: boolean
    updated_at?: boolean
    regenerated_at?: boolean
    device_id?: boolean
    last_reset_period?: boolean
    reset_count?: boolean
    secret_key?: boolean | SecretKeyLicenseDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["licenseKey"]>

  export type LicenseKeySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    secret_key_id?: boolean
    customer_id?: boolean
    email?: boolean
    code?: boolean
    can_regenerate?: boolean
    is_revoked?: boolean
    created_at?: boolean
    updated_at?: boolean
    regenerated_at?: boolean
    device_id?: boolean
    last_reset_period?: boolean
    reset_count?: boolean
    secret_key?: boolean | SecretKeyLicenseDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["licenseKey"]>

  export type LicenseKeySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    secret_key_id?: boolean
    customer_id?: boolean
    email?: boolean
    code?: boolean
    can_regenerate?: boolean
    is_revoked?: boolean
    created_at?: boolean
    updated_at?: boolean
    regenerated_at?: boolean
    device_id?: boolean
    last_reset_period?: boolean
    reset_count?: boolean
    secret_key?: boolean | SecretKeyLicenseDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["licenseKey"]>

  export type LicenseKeySelectScalar = {
    id?: boolean
    secret_key_id?: boolean
    customer_id?: boolean
    email?: boolean
    code?: boolean
    can_regenerate?: boolean
    is_revoked?: boolean
    created_at?: boolean
    updated_at?: boolean
    regenerated_at?: boolean
    device_id?: boolean
    last_reset_period?: boolean
    reset_count?: boolean
  }

  export type LicenseKeyOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "secret_key_id" | "customer_id" | "email" | "code" | "can_regenerate" | "is_revoked" | "created_at" | "updated_at" | "regenerated_at" | "device_id" | "last_reset_period" | "reset_count", ExtArgs["result"]["licenseKey"]>
  export type LicenseKeyInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    secret_key?: boolean | SecretKeyLicenseDefaultArgs<ExtArgs>
  }
  export type LicenseKeyIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    secret_key?: boolean | SecretKeyLicenseDefaultArgs<ExtArgs>
  }
  export type LicenseKeyIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    secret_key?: boolean | SecretKeyLicenseDefaultArgs<ExtArgs>
  }

  export type $LicenseKeyPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LicenseKey"
    objects: {
      secret_key: Prisma.$SecretKeyLicensePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      secret_key_id: bigint
      customer_id: string
      email: string
      code: string
      can_regenerate: boolean
      is_revoked: boolean
      created_at: bigint
      updated_at: bigint
      regenerated_at: bigint | null
      device_id: string | null
      last_reset_period: string | null
      reset_count: number
    }, ExtArgs["result"]["licenseKey"]>
    composites: {}
  }

  type LicenseKeyGetPayload<S extends boolean | null | undefined | LicenseKeyDefaultArgs> = $Result.GetResult<Prisma.$LicenseKeyPayload, S>

  type LicenseKeyCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LicenseKeyFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LicenseKeyCountAggregateInputType | true
    }

  export interface LicenseKeyDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LicenseKey'], meta: { name: 'LicenseKey' } }
    /**
     * Find zero or one LicenseKey that matches the filter.
     * @param {LicenseKeyFindUniqueArgs} args - Arguments to find a LicenseKey
     * @example
     * // Get one LicenseKey
     * const licenseKey = await prisma.licenseKey.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LicenseKeyFindUniqueArgs>(args: SelectSubset<T, LicenseKeyFindUniqueArgs<ExtArgs>>): Prisma__LicenseKeyClient<$Result.GetResult<Prisma.$LicenseKeyPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one LicenseKey that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LicenseKeyFindUniqueOrThrowArgs} args - Arguments to find a LicenseKey
     * @example
     * // Get one LicenseKey
     * const licenseKey = await prisma.licenseKey.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LicenseKeyFindUniqueOrThrowArgs>(args: SelectSubset<T, LicenseKeyFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LicenseKeyClient<$Result.GetResult<Prisma.$LicenseKeyPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LicenseKey that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LicenseKeyFindFirstArgs} args - Arguments to find a LicenseKey
     * @example
     * // Get one LicenseKey
     * const licenseKey = await prisma.licenseKey.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LicenseKeyFindFirstArgs>(args?: SelectSubset<T, LicenseKeyFindFirstArgs<ExtArgs>>): Prisma__LicenseKeyClient<$Result.GetResult<Prisma.$LicenseKeyPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LicenseKey that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LicenseKeyFindFirstOrThrowArgs} args - Arguments to find a LicenseKey
     * @example
     * // Get one LicenseKey
     * const licenseKey = await prisma.licenseKey.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LicenseKeyFindFirstOrThrowArgs>(args?: SelectSubset<T, LicenseKeyFindFirstOrThrowArgs<ExtArgs>>): Prisma__LicenseKeyClient<$Result.GetResult<Prisma.$LicenseKeyPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more LicenseKeys that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LicenseKeyFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LicenseKeys
     * const licenseKeys = await prisma.licenseKey.findMany()
     * 
     * // Get first 10 LicenseKeys
     * const licenseKeys = await prisma.licenseKey.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const licenseKeyWithIdOnly = await prisma.licenseKey.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LicenseKeyFindManyArgs>(args?: SelectSubset<T, LicenseKeyFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LicenseKeyPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a LicenseKey.
     * @param {LicenseKeyCreateArgs} args - Arguments to create a LicenseKey.
     * @example
     * // Create one LicenseKey
     * const LicenseKey = await prisma.licenseKey.create({
     *   data: {
     *     // ... data to create a LicenseKey
     *   }
     * })
     * 
     */
    create<T extends LicenseKeyCreateArgs>(args: SelectSubset<T, LicenseKeyCreateArgs<ExtArgs>>): Prisma__LicenseKeyClient<$Result.GetResult<Prisma.$LicenseKeyPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many LicenseKeys.
     * @param {LicenseKeyCreateManyArgs} args - Arguments to create many LicenseKeys.
     * @example
     * // Create many LicenseKeys
     * const licenseKey = await prisma.licenseKey.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LicenseKeyCreateManyArgs>(args?: SelectSubset<T, LicenseKeyCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many LicenseKeys and returns the data saved in the database.
     * @param {LicenseKeyCreateManyAndReturnArgs} args - Arguments to create many LicenseKeys.
     * @example
     * // Create many LicenseKeys
     * const licenseKey = await prisma.licenseKey.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many LicenseKeys and only return the `id`
     * const licenseKeyWithIdOnly = await prisma.licenseKey.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LicenseKeyCreateManyAndReturnArgs>(args?: SelectSubset<T, LicenseKeyCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LicenseKeyPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a LicenseKey.
     * @param {LicenseKeyDeleteArgs} args - Arguments to delete one LicenseKey.
     * @example
     * // Delete one LicenseKey
     * const LicenseKey = await prisma.licenseKey.delete({
     *   where: {
     *     // ... filter to delete one LicenseKey
     *   }
     * })
     * 
     */
    delete<T extends LicenseKeyDeleteArgs>(args: SelectSubset<T, LicenseKeyDeleteArgs<ExtArgs>>): Prisma__LicenseKeyClient<$Result.GetResult<Prisma.$LicenseKeyPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one LicenseKey.
     * @param {LicenseKeyUpdateArgs} args - Arguments to update one LicenseKey.
     * @example
     * // Update one LicenseKey
     * const licenseKey = await prisma.licenseKey.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LicenseKeyUpdateArgs>(args: SelectSubset<T, LicenseKeyUpdateArgs<ExtArgs>>): Prisma__LicenseKeyClient<$Result.GetResult<Prisma.$LicenseKeyPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more LicenseKeys.
     * @param {LicenseKeyDeleteManyArgs} args - Arguments to filter LicenseKeys to delete.
     * @example
     * // Delete a few LicenseKeys
     * const { count } = await prisma.licenseKey.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LicenseKeyDeleteManyArgs>(args?: SelectSubset<T, LicenseKeyDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LicenseKeys.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LicenseKeyUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LicenseKeys
     * const licenseKey = await prisma.licenseKey.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LicenseKeyUpdateManyArgs>(args: SelectSubset<T, LicenseKeyUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LicenseKeys and returns the data updated in the database.
     * @param {LicenseKeyUpdateManyAndReturnArgs} args - Arguments to update many LicenseKeys.
     * @example
     * // Update many LicenseKeys
     * const licenseKey = await prisma.licenseKey.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more LicenseKeys and only return the `id`
     * const licenseKeyWithIdOnly = await prisma.licenseKey.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LicenseKeyUpdateManyAndReturnArgs>(args: SelectSubset<T, LicenseKeyUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LicenseKeyPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one LicenseKey.
     * @param {LicenseKeyUpsertArgs} args - Arguments to update or create a LicenseKey.
     * @example
     * // Update or create a LicenseKey
     * const licenseKey = await prisma.licenseKey.upsert({
     *   create: {
     *     // ... data to create a LicenseKey
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LicenseKey we want to update
     *   }
     * })
     */
    upsert<T extends LicenseKeyUpsertArgs>(args: SelectSubset<T, LicenseKeyUpsertArgs<ExtArgs>>): Prisma__LicenseKeyClient<$Result.GetResult<Prisma.$LicenseKeyPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of LicenseKeys.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LicenseKeyCountArgs} args - Arguments to filter LicenseKeys to count.
     * @example
     * // Count the number of LicenseKeys
     * const count = await prisma.licenseKey.count({
     *   where: {
     *     // ... the filter for the LicenseKeys we want to count
     *   }
     * })
    **/
    count<T extends LicenseKeyCountArgs>(
      args?: Subset<T, LicenseKeyCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LicenseKeyCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LicenseKey.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LicenseKeyAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LicenseKeyAggregateArgs>(args: Subset<T, LicenseKeyAggregateArgs>): Prisma.PrismaPromise<GetLicenseKeyAggregateType<T>>

    /**
     * Group by LicenseKey.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LicenseKeyGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LicenseKeyGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LicenseKeyGroupByArgs['orderBy'] }
        : { orderBy?: LicenseKeyGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LicenseKeyGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLicenseKeyGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LicenseKey model
   */
  readonly fields: LicenseKeyFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LicenseKey.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LicenseKeyClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    secret_key<T extends SecretKeyLicenseDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SecretKeyLicenseDefaultArgs<ExtArgs>>): Prisma__SecretKeyLicenseClient<$Result.GetResult<Prisma.$SecretKeyLicensePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the LicenseKey model
   */
  interface LicenseKeyFieldRefs {
    readonly id: FieldRef<"LicenseKey", 'String'>
    readonly secret_key_id: FieldRef<"LicenseKey", 'BigInt'>
    readonly customer_id: FieldRef<"LicenseKey", 'String'>
    readonly email: FieldRef<"LicenseKey", 'String'>
    readonly code: FieldRef<"LicenseKey", 'String'>
    readonly can_regenerate: FieldRef<"LicenseKey", 'Boolean'>
    readonly is_revoked: FieldRef<"LicenseKey", 'Boolean'>
    readonly created_at: FieldRef<"LicenseKey", 'BigInt'>
    readonly updated_at: FieldRef<"LicenseKey", 'BigInt'>
    readonly regenerated_at: FieldRef<"LicenseKey", 'BigInt'>
    readonly device_id: FieldRef<"LicenseKey", 'String'>
    readonly last_reset_period: FieldRef<"LicenseKey", 'String'>
    readonly reset_count: FieldRef<"LicenseKey", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * LicenseKey findUnique
   */
  export type LicenseKeyFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LicenseKey
     */
    select?: LicenseKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LicenseKey
     */
    omit?: LicenseKeyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LicenseKeyInclude<ExtArgs> | null
    /**
     * Filter, which LicenseKey to fetch.
     */
    where: LicenseKeyWhereUniqueInput
  }

  /**
   * LicenseKey findUniqueOrThrow
   */
  export type LicenseKeyFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LicenseKey
     */
    select?: LicenseKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LicenseKey
     */
    omit?: LicenseKeyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LicenseKeyInclude<ExtArgs> | null
    /**
     * Filter, which LicenseKey to fetch.
     */
    where: LicenseKeyWhereUniqueInput
  }

  /**
   * LicenseKey findFirst
   */
  export type LicenseKeyFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LicenseKey
     */
    select?: LicenseKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LicenseKey
     */
    omit?: LicenseKeyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LicenseKeyInclude<ExtArgs> | null
    /**
     * Filter, which LicenseKey to fetch.
     */
    where?: LicenseKeyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LicenseKeys to fetch.
     */
    orderBy?: LicenseKeyOrderByWithRelationInput | LicenseKeyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LicenseKeys.
     */
    cursor?: LicenseKeyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LicenseKeys from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LicenseKeys.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LicenseKeys.
     */
    distinct?: LicenseKeyScalarFieldEnum | LicenseKeyScalarFieldEnum[]
  }

  /**
   * LicenseKey findFirstOrThrow
   */
  export type LicenseKeyFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LicenseKey
     */
    select?: LicenseKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LicenseKey
     */
    omit?: LicenseKeyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LicenseKeyInclude<ExtArgs> | null
    /**
     * Filter, which LicenseKey to fetch.
     */
    where?: LicenseKeyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LicenseKeys to fetch.
     */
    orderBy?: LicenseKeyOrderByWithRelationInput | LicenseKeyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LicenseKeys.
     */
    cursor?: LicenseKeyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LicenseKeys from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LicenseKeys.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LicenseKeys.
     */
    distinct?: LicenseKeyScalarFieldEnum | LicenseKeyScalarFieldEnum[]
  }

  /**
   * LicenseKey findMany
   */
  export type LicenseKeyFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LicenseKey
     */
    select?: LicenseKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LicenseKey
     */
    omit?: LicenseKeyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LicenseKeyInclude<ExtArgs> | null
    /**
     * Filter, which LicenseKeys to fetch.
     */
    where?: LicenseKeyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LicenseKeys to fetch.
     */
    orderBy?: LicenseKeyOrderByWithRelationInput | LicenseKeyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LicenseKeys.
     */
    cursor?: LicenseKeyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LicenseKeys from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LicenseKeys.
     */
    skip?: number
    distinct?: LicenseKeyScalarFieldEnum | LicenseKeyScalarFieldEnum[]
  }

  /**
   * LicenseKey create
   */
  export type LicenseKeyCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LicenseKey
     */
    select?: LicenseKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LicenseKey
     */
    omit?: LicenseKeyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LicenseKeyInclude<ExtArgs> | null
    /**
     * The data needed to create a LicenseKey.
     */
    data: XOR<LicenseKeyCreateInput, LicenseKeyUncheckedCreateInput>
  }

  /**
   * LicenseKey createMany
   */
  export type LicenseKeyCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LicenseKeys.
     */
    data: LicenseKeyCreateManyInput | LicenseKeyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LicenseKey createManyAndReturn
   */
  export type LicenseKeyCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LicenseKey
     */
    select?: LicenseKeySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LicenseKey
     */
    omit?: LicenseKeyOmit<ExtArgs> | null
    /**
     * The data used to create many LicenseKeys.
     */
    data: LicenseKeyCreateManyInput | LicenseKeyCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LicenseKeyIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * LicenseKey update
   */
  export type LicenseKeyUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LicenseKey
     */
    select?: LicenseKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LicenseKey
     */
    omit?: LicenseKeyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LicenseKeyInclude<ExtArgs> | null
    /**
     * The data needed to update a LicenseKey.
     */
    data: XOR<LicenseKeyUpdateInput, LicenseKeyUncheckedUpdateInput>
    /**
     * Choose, which LicenseKey to update.
     */
    where: LicenseKeyWhereUniqueInput
  }

  /**
   * LicenseKey updateMany
   */
  export type LicenseKeyUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LicenseKeys.
     */
    data: XOR<LicenseKeyUpdateManyMutationInput, LicenseKeyUncheckedUpdateManyInput>
    /**
     * Filter which LicenseKeys to update
     */
    where?: LicenseKeyWhereInput
    /**
     * Limit how many LicenseKeys to update.
     */
    limit?: number
  }

  /**
   * LicenseKey updateManyAndReturn
   */
  export type LicenseKeyUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LicenseKey
     */
    select?: LicenseKeySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LicenseKey
     */
    omit?: LicenseKeyOmit<ExtArgs> | null
    /**
     * The data used to update LicenseKeys.
     */
    data: XOR<LicenseKeyUpdateManyMutationInput, LicenseKeyUncheckedUpdateManyInput>
    /**
     * Filter which LicenseKeys to update
     */
    where?: LicenseKeyWhereInput
    /**
     * Limit how many LicenseKeys to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LicenseKeyIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * LicenseKey upsert
   */
  export type LicenseKeyUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LicenseKey
     */
    select?: LicenseKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LicenseKey
     */
    omit?: LicenseKeyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LicenseKeyInclude<ExtArgs> | null
    /**
     * The filter to search for the LicenseKey to update in case it exists.
     */
    where: LicenseKeyWhereUniqueInput
    /**
     * In case the LicenseKey found by the `where` argument doesn't exist, create a new LicenseKey with this data.
     */
    create: XOR<LicenseKeyCreateInput, LicenseKeyUncheckedCreateInput>
    /**
     * In case the LicenseKey was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LicenseKeyUpdateInput, LicenseKeyUncheckedUpdateInput>
  }

  /**
   * LicenseKey delete
   */
  export type LicenseKeyDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LicenseKey
     */
    select?: LicenseKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LicenseKey
     */
    omit?: LicenseKeyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LicenseKeyInclude<ExtArgs> | null
    /**
     * Filter which LicenseKey to delete.
     */
    where: LicenseKeyWhereUniqueInput
  }

  /**
   * LicenseKey deleteMany
   */
  export type LicenseKeyDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LicenseKeys to delete
     */
    where?: LicenseKeyWhereInput
    /**
     * Limit how many LicenseKeys to delete.
     */
    limit?: number
  }

  /**
   * LicenseKey without action
   */
  export type LicenseKeyDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LicenseKey
     */
    select?: LicenseKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LicenseKey
     */
    omit?: LicenseKeyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LicenseKeyInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const SecretKeyLicenseScalarFieldEnum: {
    id: 'id',
    product_id: 'product_id',
    key: 'key',
    app_name: 'app_name',
    created_at: 'created_at',
    regenerated_at: 'regenerated_at'
  };

  export type SecretKeyLicenseScalarFieldEnum = (typeof SecretKeyLicenseScalarFieldEnum)[keyof typeof SecretKeyLicenseScalarFieldEnum]


  export const LicenseKeyScalarFieldEnum: {
    id: 'id',
    secret_key_id: 'secret_key_id',
    customer_id: 'customer_id',
    email: 'email',
    code: 'code',
    can_regenerate: 'can_regenerate',
    is_revoked: 'is_revoked',
    created_at: 'created_at',
    updated_at: 'updated_at',
    regenerated_at: 'regenerated_at',
    device_id: 'device_id',
    last_reset_period: 'last_reset_period',
    reset_count: 'reset_count'
  };

  export type LicenseKeyScalarFieldEnum = (typeof LicenseKeyScalarFieldEnum)[keyof typeof LicenseKeyScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'BigInt[]'
   */
  export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type SecretKeyLicenseWhereInput = {
    AND?: SecretKeyLicenseWhereInput | SecretKeyLicenseWhereInput[]
    OR?: SecretKeyLicenseWhereInput[]
    NOT?: SecretKeyLicenseWhereInput | SecretKeyLicenseWhereInput[]
    id?: BigIntFilter<"SecretKeyLicense"> | bigint | number
    product_id?: UuidFilter<"SecretKeyLicense"> | string
    key?: StringFilter<"SecretKeyLicense"> | string
    app_name?: StringFilter<"SecretKeyLicense"> | string
    created_at?: BigIntFilter<"SecretKeyLicense"> | bigint | number
    regenerated_at?: BigIntNullableFilter<"SecretKeyLicense"> | bigint | number | null
    license_key?: LicenseKeyListRelationFilter
  }

  export type SecretKeyLicenseOrderByWithRelationInput = {
    id?: SortOrder
    product_id?: SortOrder
    key?: SortOrder
    app_name?: SortOrder
    created_at?: SortOrder
    regenerated_at?: SortOrderInput | SortOrder
    license_key?: LicenseKeyOrderByRelationAggregateInput
  }

  export type SecretKeyLicenseWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    product_id?: string
    AND?: SecretKeyLicenseWhereInput | SecretKeyLicenseWhereInput[]
    OR?: SecretKeyLicenseWhereInput[]
    NOT?: SecretKeyLicenseWhereInput | SecretKeyLicenseWhereInput[]
    key?: StringFilter<"SecretKeyLicense"> | string
    app_name?: StringFilter<"SecretKeyLicense"> | string
    created_at?: BigIntFilter<"SecretKeyLicense"> | bigint | number
    regenerated_at?: BigIntNullableFilter<"SecretKeyLicense"> | bigint | number | null
    license_key?: LicenseKeyListRelationFilter
  }, "id" | "product_id">

  export type SecretKeyLicenseOrderByWithAggregationInput = {
    id?: SortOrder
    product_id?: SortOrder
    key?: SortOrder
    app_name?: SortOrder
    created_at?: SortOrder
    regenerated_at?: SortOrderInput | SortOrder
    _count?: SecretKeyLicenseCountOrderByAggregateInput
    _avg?: SecretKeyLicenseAvgOrderByAggregateInput
    _max?: SecretKeyLicenseMaxOrderByAggregateInput
    _min?: SecretKeyLicenseMinOrderByAggregateInput
    _sum?: SecretKeyLicenseSumOrderByAggregateInput
  }

  export type SecretKeyLicenseScalarWhereWithAggregatesInput = {
    AND?: SecretKeyLicenseScalarWhereWithAggregatesInput | SecretKeyLicenseScalarWhereWithAggregatesInput[]
    OR?: SecretKeyLicenseScalarWhereWithAggregatesInput[]
    NOT?: SecretKeyLicenseScalarWhereWithAggregatesInput | SecretKeyLicenseScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"SecretKeyLicense"> | bigint | number
    product_id?: UuidWithAggregatesFilter<"SecretKeyLicense"> | string
    key?: StringWithAggregatesFilter<"SecretKeyLicense"> | string
    app_name?: StringWithAggregatesFilter<"SecretKeyLicense"> | string
    created_at?: BigIntWithAggregatesFilter<"SecretKeyLicense"> | bigint | number
    regenerated_at?: BigIntNullableWithAggregatesFilter<"SecretKeyLicense"> | bigint | number | null
  }

  export type LicenseKeyWhereInput = {
    AND?: LicenseKeyWhereInput | LicenseKeyWhereInput[]
    OR?: LicenseKeyWhereInput[]
    NOT?: LicenseKeyWhereInput | LicenseKeyWhereInput[]
    id?: UuidFilter<"LicenseKey"> | string
    secret_key_id?: BigIntFilter<"LicenseKey"> | bigint | number
    customer_id?: UuidFilter<"LicenseKey"> | string
    email?: StringFilter<"LicenseKey"> | string
    code?: StringFilter<"LicenseKey"> | string
    can_regenerate?: BoolFilter<"LicenseKey"> | boolean
    is_revoked?: BoolFilter<"LicenseKey"> | boolean
    created_at?: BigIntFilter<"LicenseKey"> | bigint | number
    updated_at?: BigIntFilter<"LicenseKey"> | bigint | number
    regenerated_at?: BigIntNullableFilter<"LicenseKey"> | bigint | number | null
    device_id?: StringNullableFilter<"LicenseKey"> | string | null
    last_reset_period?: StringNullableFilter<"LicenseKey"> | string | null
    reset_count?: IntFilter<"LicenseKey"> | number
    secret_key?: XOR<SecretKeyLicenseScalarRelationFilter, SecretKeyLicenseWhereInput>
  }

  export type LicenseKeyOrderByWithRelationInput = {
    id?: SortOrder
    secret_key_id?: SortOrder
    customer_id?: SortOrder
    email?: SortOrder
    code?: SortOrder
    can_regenerate?: SortOrder
    is_revoked?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    regenerated_at?: SortOrderInput | SortOrder
    device_id?: SortOrderInput | SortOrder
    last_reset_period?: SortOrderInput | SortOrder
    reset_count?: SortOrder
    secret_key?: SecretKeyLicenseOrderByWithRelationInput
  }

  export type LicenseKeyWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    customer_id_secret_key_id?: LicenseKeyCustomer_idSecret_key_idCompoundUniqueInput
    AND?: LicenseKeyWhereInput | LicenseKeyWhereInput[]
    OR?: LicenseKeyWhereInput[]
    NOT?: LicenseKeyWhereInput | LicenseKeyWhereInput[]
    secret_key_id?: BigIntFilter<"LicenseKey"> | bigint | number
    customer_id?: UuidFilter<"LicenseKey"> | string
    email?: StringFilter<"LicenseKey"> | string
    code?: StringFilter<"LicenseKey"> | string
    can_regenerate?: BoolFilter<"LicenseKey"> | boolean
    is_revoked?: BoolFilter<"LicenseKey"> | boolean
    created_at?: BigIntFilter<"LicenseKey"> | bigint | number
    updated_at?: BigIntFilter<"LicenseKey"> | bigint | number
    regenerated_at?: BigIntNullableFilter<"LicenseKey"> | bigint | number | null
    device_id?: StringNullableFilter<"LicenseKey"> | string | null
    last_reset_period?: StringNullableFilter<"LicenseKey"> | string | null
    reset_count?: IntFilter<"LicenseKey"> | number
    secret_key?: XOR<SecretKeyLicenseScalarRelationFilter, SecretKeyLicenseWhereInput>
  }, "id" | "customer_id_secret_key_id">

  export type LicenseKeyOrderByWithAggregationInput = {
    id?: SortOrder
    secret_key_id?: SortOrder
    customer_id?: SortOrder
    email?: SortOrder
    code?: SortOrder
    can_regenerate?: SortOrder
    is_revoked?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    regenerated_at?: SortOrderInput | SortOrder
    device_id?: SortOrderInput | SortOrder
    last_reset_period?: SortOrderInput | SortOrder
    reset_count?: SortOrder
    _count?: LicenseKeyCountOrderByAggregateInput
    _avg?: LicenseKeyAvgOrderByAggregateInput
    _max?: LicenseKeyMaxOrderByAggregateInput
    _min?: LicenseKeyMinOrderByAggregateInput
    _sum?: LicenseKeySumOrderByAggregateInput
  }

  export type LicenseKeyScalarWhereWithAggregatesInput = {
    AND?: LicenseKeyScalarWhereWithAggregatesInput | LicenseKeyScalarWhereWithAggregatesInput[]
    OR?: LicenseKeyScalarWhereWithAggregatesInput[]
    NOT?: LicenseKeyScalarWhereWithAggregatesInput | LicenseKeyScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"LicenseKey"> | string
    secret_key_id?: BigIntWithAggregatesFilter<"LicenseKey"> | bigint | number
    customer_id?: UuidWithAggregatesFilter<"LicenseKey"> | string
    email?: StringWithAggregatesFilter<"LicenseKey"> | string
    code?: StringWithAggregatesFilter<"LicenseKey"> | string
    can_regenerate?: BoolWithAggregatesFilter<"LicenseKey"> | boolean
    is_revoked?: BoolWithAggregatesFilter<"LicenseKey"> | boolean
    created_at?: BigIntWithAggregatesFilter<"LicenseKey"> | bigint | number
    updated_at?: BigIntWithAggregatesFilter<"LicenseKey"> | bigint | number
    regenerated_at?: BigIntNullableWithAggregatesFilter<"LicenseKey"> | bigint | number | null
    device_id?: StringNullableWithAggregatesFilter<"LicenseKey"> | string | null
    last_reset_period?: StringNullableWithAggregatesFilter<"LicenseKey"> | string | null
    reset_count?: IntWithAggregatesFilter<"LicenseKey"> | number
  }

  export type SecretKeyLicenseCreateInput = {
    id?: bigint | number
    product_id: string
    key: string
    app_name: string
    created_at: bigint | number
    regenerated_at?: bigint | number | null
    license_key?: LicenseKeyCreateNestedManyWithoutSecret_keyInput
  }

  export type SecretKeyLicenseUncheckedCreateInput = {
    id?: bigint | number
    product_id: string
    key: string
    app_name: string
    created_at: bigint | number
    regenerated_at?: bigint | number | null
    license_key?: LicenseKeyUncheckedCreateNestedManyWithoutSecret_keyInput
  }

  export type SecretKeyLicenseUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    product_id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    app_name?: StringFieldUpdateOperationsInput | string
    created_at?: BigIntFieldUpdateOperationsInput | bigint | number
    regenerated_at?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    license_key?: LicenseKeyUpdateManyWithoutSecret_keyNestedInput
  }

  export type SecretKeyLicenseUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    product_id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    app_name?: StringFieldUpdateOperationsInput | string
    created_at?: BigIntFieldUpdateOperationsInput | bigint | number
    regenerated_at?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    license_key?: LicenseKeyUncheckedUpdateManyWithoutSecret_keyNestedInput
  }

  export type SecretKeyLicenseCreateManyInput = {
    id?: bigint | number
    product_id: string
    key: string
    app_name: string
    created_at: bigint | number
    regenerated_at?: bigint | number | null
  }

  export type SecretKeyLicenseUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    product_id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    app_name?: StringFieldUpdateOperationsInput | string
    created_at?: BigIntFieldUpdateOperationsInput | bigint | number
    regenerated_at?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  }

  export type SecretKeyLicenseUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    product_id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    app_name?: StringFieldUpdateOperationsInput | string
    created_at?: BigIntFieldUpdateOperationsInput | bigint | number
    regenerated_at?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  }

  export type LicenseKeyCreateInput = {
    id?: string
    customer_id: string
    email: string
    code: string
    can_regenerate?: boolean
    is_revoked?: boolean
    created_at: bigint | number
    updated_at: bigint | number
    regenerated_at?: bigint | number | null
    device_id?: string | null
    last_reset_period?: string | null
    reset_count?: number
    secret_key: SecretKeyLicenseCreateNestedOneWithoutLicense_keyInput
  }

  export type LicenseKeyUncheckedCreateInput = {
    id?: string
    secret_key_id: bigint | number
    customer_id: string
    email: string
    code: string
    can_regenerate?: boolean
    is_revoked?: boolean
    created_at: bigint | number
    updated_at: bigint | number
    regenerated_at?: bigint | number | null
    device_id?: string | null
    last_reset_period?: string | null
    reset_count?: number
  }

  export type LicenseKeyUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    customer_id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    can_regenerate?: BoolFieldUpdateOperationsInput | boolean
    is_revoked?: BoolFieldUpdateOperationsInput | boolean
    created_at?: BigIntFieldUpdateOperationsInput | bigint | number
    updated_at?: BigIntFieldUpdateOperationsInput | bigint | number
    regenerated_at?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    device_id?: NullableStringFieldUpdateOperationsInput | string | null
    last_reset_period?: NullableStringFieldUpdateOperationsInput | string | null
    reset_count?: IntFieldUpdateOperationsInput | number
    secret_key?: SecretKeyLicenseUpdateOneRequiredWithoutLicense_keyNestedInput
  }

  export type LicenseKeyUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    secret_key_id?: BigIntFieldUpdateOperationsInput | bigint | number
    customer_id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    can_regenerate?: BoolFieldUpdateOperationsInput | boolean
    is_revoked?: BoolFieldUpdateOperationsInput | boolean
    created_at?: BigIntFieldUpdateOperationsInput | bigint | number
    updated_at?: BigIntFieldUpdateOperationsInput | bigint | number
    regenerated_at?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    device_id?: NullableStringFieldUpdateOperationsInput | string | null
    last_reset_period?: NullableStringFieldUpdateOperationsInput | string | null
    reset_count?: IntFieldUpdateOperationsInput | number
  }

  export type LicenseKeyCreateManyInput = {
    id?: string
    secret_key_id: bigint | number
    customer_id: string
    email: string
    code: string
    can_regenerate?: boolean
    is_revoked?: boolean
    created_at: bigint | number
    updated_at: bigint | number
    regenerated_at?: bigint | number | null
    device_id?: string | null
    last_reset_period?: string | null
    reset_count?: number
  }

  export type LicenseKeyUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    customer_id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    can_regenerate?: BoolFieldUpdateOperationsInput | boolean
    is_revoked?: BoolFieldUpdateOperationsInput | boolean
    created_at?: BigIntFieldUpdateOperationsInput | bigint | number
    updated_at?: BigIntFieldUpdateOperationsInput | bigint | number
    regenerated_at?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    device_id?: NullableStringFieldUpdateOperationsInput | string | null
    last_reset_period?: NullableStringFieldUpdateOperationsInput | string | null
    reset_count?: IntFieldUpdateOperationsInput | number
  }

  export type LicenseKeyUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    secret_key_id?: BigIntFieldUpdateOperationsInput | bigint | number
    customer_id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    can_regenerate?: BoolFieldUpdateOperationsInput | boolean
    is_revoked?: BoolFieldUpdateOperationsInput | boolean
    created_at?: BigIntFieldUpdateOperationsInput | bigint | number
    updated_at?: BigIntFieldUpdateOperationsInput | bigint | number
    regenerated_at?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    device_id?: NullableStringFieldUpdateOperationsInput | string | null
    last_reset_period?: NullableStringFieldUpdateOperationsInput | string | null
    reset_count?: IntFieldUpdateOperationsInput | number
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type UuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type BigIntNullableFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableFilter<$PrismaModel> | bigint | number | null
  }

  export type LicenseKeyListRelationFilter = {
    every?: LicenseKeyWhereInput
    some?: LicenseKeyWhereInput
    none?: LicenseKeyWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type LicenseKeyOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SecretKeyLicenseCountOrderByAggregateInput = {
    id?: SortOrder
    product_id?: SortOrder
    key?: SortOrder
    app_name?: SortOrder
    created_at?: SortOrder
    regenerated_at?: SortOrder
  }

  export type SecretKeyLicenseAvgOrderByAggregateInput = {
    id?: SortOrder
    created_at?: SortOrder
    regenerated_at?: SortOrder
  }

  export type SecretKeyLicenseMaxOrderByAggregateInput = {
    id?: SortOrder
    product_id?: SortOrder
    key?: SortOrder
    app_name?: SortOrder
    created_at?: SortOrder
    regenerated_at?: SortOrder
  }

  export type SecretKeyLicenseMinOrderByAggregateInput = {
    id?: SortOrder
    product_id?: SortOrder
    key?: SortOrder
    app_name?: SortOrder
    created_at?: SortOrder
    regenerated_at?: SortOrder
  }

  export type SecretKeyLicenseSumOrderByAggregateInput = {
    id?: SortOrder
    created_at?: SortOrder
    regenerated_at?: SortOrder
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type UuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type BigIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableWithAggregatesFilter<$PrismaModel> | bigint | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedBigIntNullableFilter<$PrismaModel>
    _min?: NestedBigIntNullableFilter<$PrismaModel>
    _max?: NestedBigIntNullableFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type SecretKeyLicenseScalarRelationFilter = {
    is?: SecretKeyLicenseWhereInput
    isNot?: SecretKeyLicenseWhereInput
  }

  export type LicenseKeyCustomer_idSecret_key_idCompoundUniqueInput = {
    customer_id: string
    secret_key_id: bigint | number
  }

  export type LicenseKeyCountOrderByAggregateInput = {
    id?: SortOrder
    secret_key_id?: SortOrder
    customer_id?: SortOrder
    email?: SortOrder
    code?: SortOrder
    can_regenerate?: SortOrder
    is_revoked?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    regenerated_at?: SortOrder
    device_id?: SortOrder
    last_reset_period?: SortOrder
    reset_count?: SortOrder
  }

  export type LicenseKeyAvgOrderByAggregateInput = {
    secret_key_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    regenerated_at?: SortOrder
    reset_count?: SortOrder
  }

  export type LicenseKeyMaxOrderByAggregateInput = {
    id?: SortOrder
    secret_key_id?: SortOrder
    customer_id?: SortOrder
    email?: SortOrder
    code?: SortOrder
    can_regenerate?: SortOrder
    is_revoked?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    regenerated_at?: SortOrder
    device_id?: SortOrder
    last_reset_period?: SortOrder
    reset_count?: SortOrder
  }

  export type LicenseKeyMinOrderByAggregateInput = {
    id?: SortOrder
    secret_key_id?: SortOrder
    customer_id?: SortOrder
    email?: SortOrder
    code?: SortOrder
    can_regenerate?: SortOrder
    is_revoked?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    regenerated_at?: SortOrder
    device_id?: SortOrder
    last_reset_period?: SortOrder
    reset_count?: SortOrder
  }

  export type LicenseKeySumOrderByAggregateInput = {
    secret_key_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    regenerated_at?: SortOrder
    reset_count?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type LicenseKeyCreateNestedManyWithoutSecret_keyInput = {
    create?: XOR<LicenseKeyCreateWithoutSecret_keyInput, LicenseKeyUncheckedCreateWithoutSecret_keyInput> | LicenseKeyCreateWithoutSecret_keyInput[] | LicenseKeyUncheckedCreateWithoutSecret_keyInput[]
    connectOrCreate?: LicenseKeyCreateOrConnectWithoutSecret_keyInput | LicenseKeyCreateOrConnectWithoutSecret_keyInput[]
    createMany?: LicenseKeyCreateManySecret_keyInputEnvelope
    connect?: LicenseKeyWhereUniqueInput | LicenseKeyWhereUniqueInput[]
  }

  export type LicenseKeyUncheckedCreateNestedManyWithoutSecret_keyInput = {
    create?: XOR<LicenseKeyCreateWithoutSecret_keyInput, LicenseKeyUncheckedCreateWithoutSecret_keyInput> | LicenseKeyCreateWithoutSecret_keyInput[] | LicenseKeyUncheckedCreateWithoutSecret_keyInput[]
    connectOrCreate?: LicenseKeyCreateOrConnectWithoutSecret_keyInput | LicenseKeyCreateOrConnectWithoutSecret_keyInput[]
    createMany?: LicenseKeyCreateManySecret_keyInputEnvelope
    connect?: LicenseKeyWhereUniqueInput | LicenseKeyWhereUniqueInput[]
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableBigIntFieldUpdateOperationsInput = {
    set?: bigint | number | null
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type LicenseKeyUpdateManyWithoutSecret_keyNestedInput = {
    create?: XOR<LicenseKeyCreateWithoutSecret_keyInput, LicenseKeyUncheckedCreateWithoutSecret_keyInput> | LicenseKeyCreateWithoutSecret_keyInput[] | LicenseKeyUncheckedCreateWithoutSecret_keyInput[]
    connectOrCreate?: LicenseKeyCreateOrConnectWithoutSecret_keyInput | LicenseKeyCreateOrConnectWithoutSecret_keyInput[]
    upsert?: LicenseKeyUpsertWithWhereUniqueWithoutSecret_keyInput | LicenseKeyUpsertWithWhereUniqueWithoutSecret_keyInput[]
    createMany?: LicenseKeyCreateManySecret_keyInputEnvelope
    set?: LicenseKeyWhereUniqueInput | LicenseKeyWhereUniqueInput[]
    disconnect?: LicenseKeyWhereUniqueInput | LicenseKeyWhereUniqueInput[]
    delete?: LicenseKeyWhereUniqueInput | LicenseKeyWhereUniqueInput[]
    connect?: LicenseKeyWhereUniqueInput | LicenseKeyWhereUniqueInput[]
    update?: LicenseKeyUpdateWithWhereUniqueWithoutSecret_keyInput | LicenseKeyUpdateWithWhereUniqueWithoutSecret_keyInput[]
    updateMany?: LicenseKeyUpdateManyWithWhereWithoutSecret_keyInput | LicenseKeyUpdateManyWithWhereWithoutSecret_keyInput[]
    deleteMany?: LicenseKeyScalarWhereInput | LicenseKeyScalarWhereInput[]
  }

  export type LicenseKeyUncheckedUpdateManyWithoutSecret_keyNestedInput = {
    create?: XOR<LicenseKeyCreateWithoutSecret_keyInput, LicenseKeyUncheckedCreateWithoutSecret_keyInput> | LicenseKeyCreateWithoutSecret_keyInput[] | LicenseKeyUncheckedCreateWithoutSecret_keyInput[]
    connectOrCreate?: LicenseKeyCreateOrConnectWithoutSecret_keyInput | LicenseKeyCreateOrConnectWithoutSecret_keyInput[]
    upsert?: LicenseKeyUpsertWithWhereUniqueWithoutSecret_keyInput | LicenseKeyUpsertWithWhereUniqueWithoutSecret_keyInput[]
    createMany?: LicenseKeyCreateManySecret_keyInputEnvelope
    set?: LicenseKeyWhereUniqueInput | LicenseKeyWhereUniqueInput[]
    disconnect?: LicenseKeyWhereUniqueInput | LicenseKeyWhereUniqueInput[]
    delete?: LicenseKeyWhereUniqueInput | LicenseKeyWhereUniqueInput[]
    connect?: LicenseKeyWhereUniqueInput | LicenseKeyWhereUniqueInput[]
    update?: LicenseKeyUpdateWithWhereUniqueWithoutSecret_keyInput | LicenseKeyUpdateWithWhereUniqueWithoutSecret_keyInput[]
    updateMany?: LicenseKeyUpdateManyWithWhereWithoutSecret_keyInput | LicenseKeyUpdateManyWithWhereWithoutSecret_keyInput[]
    deleteMany?: LicenseKeyScalarWhereInput | LicenseKeyScalarWhereInput[]
  }

  export type SecretKeyLicenseCreateNestedOneWithoutLicense_keyInput = {
    create?: XOR<SecretKeyLicenseCreateWithoutLicense_keyInput, SecretKeyLicenseUncheckedCreateWithoutLicense_keyInput>
    connectOrCreate?: SecretKeyLicenseCreateOrConnectWithoutLicense_keyInput
    connect?: SecretKeyLicenseWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type SecretKeyLicenseUpdateOneRequiredWithoutLicense_keyNestedInput = {
    create?: XOR<SecretKeyLicenseCreateWithoutLicense_keyInput, SecretKeyLicenseUncheckedCreateWithoutLicense_keyInput>
    connectOrCreate?: SecretKeyLicenseCreateOrConnectWithoutLicense_keyInput
    upsert?: SecretKeyLicenseUpsertWithoutLicense_keyInput
    connect?: SecretKeyLicenseWhereUniqueInput
    update?: XOR<XOR<SecretKeyLicenseUpdateToOneWithWhereWithoutLicense_keyInput, SecretKeyLicenseUpdateWithoutLicense_keyInput>, SecretKeyLicenseUncheckedUpdateWithoutLicense_keyInput>
  }

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedUuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedBigIntNullableFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableFilter<$PrismaModel> | bigint | number | null
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedUuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedBigIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableWithAggregatesFilter<$PrismaModel> | bigint | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedBigIntNullableFilter<$PrismaModel>
    _min?: NestedBigIntNullableFilter<$PrismaModel>
    _max?: NestedBigIntNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type LicenseKeyCreateWithoutSecret_keyInput = {
    id?: string
    customer_id: string
    email: string
    code: string
    can_regenerate?: boolean
    is_revoked?: boolean
    created_at: bigint | number
    updated_at: bigint | number
    regenerated_at?: bigint | number | null
    device_id?: string | null
    last_reset_period?: string | null
    reset_count?: number
  }

  export type LicenseKeyUncheckedCreateWithoutSecret_keyInput = {
    id?: string
    customer_id: string
    email: string
    code: string
    can_regenerate?: boolean
    is_revoked?: boolean
    created_at: bigint | number
    updated_at: bigint | number
    regenerated_at?: bigint | number | null
    device_id?: string | null
    last_reset_period?: string | null
    reset_count?: number
  }

  export type LicenseKeyCreateOrConnectWithoutSecret_keyInput = {
    where: LicenseKeyWhereUniqueInput
    create: XOR<LicenseKeyCreateWithoutSecret_keyInput, LicenseKeyUncheckedCreateWithoutSecret_keyInput>
  }

  export type LicenseKeyCreateManySecret_keyInputEnvelope = {
    data: LicenseKeyCreateManySecret_keyInput | LicenseKeyCreateManySecret_keyInput[]
    skipDuplicates?: boolean
  }

  export type LicenseKeyUpsertWithWhereUniqueWithoutSecret_keyInput = {
    where: LicenseKeyWhereUniqueInput
    update: XOR<LicenseKeyUpdateWithoutSecret_keyInput, LicenseKeyUncheckedUpdateWithoutSecret_keyInput>
    create: XOR<LicenseKeyCreateWithoutSecret_keyInput, LicenseKeyUncheckedCreateWithoutSecret_keyInput>
  }

  export type LicenseKeyUpdateWithWhereUniqueWithoutSecret_keyInput = {
    where: LicenseKeyWhereUniqueInput
    data: XOR<LicenseKeyUpdateWithoutSecret_keyInput, LicenseKeyUncheckedUpdateWithoutSecret_keyInput>
  }

  export type LicenseKeyUpdateManyWithWhereWithoutSecret_keyInput = {
    where: LicenseKeyScalarWhereInput
    data: XOR<LicenseKeyUpdateManyMutationInput, LicenseKeyUncheckedUpdateManyWithoutSecret_keyInput>
  }

  export type LicenseKeyScalarWhereInput = {
    AND?: LicenseKeyScalarWhereInput | LicenseKeyScalarWhereInput[]
    OR?: LicenseKeyScalarWhereInput[]
    NOT?: LicenseKeyScalarWhereInput | LicenseKeyScalarWhereInput[]
    id?: UuidFilter<"LicenseKey"> | string
    secret_key_id?: BigIntFilter<"LicenseKey"> | bigint | number
    customer_id?: UuidFilter<"LicenseKey"> | string
    email?: StringFilter<"LicenseKey"> | string
    code?: StringFilter<"LicenseKey"> | string
    can_regenerate?: BoolFilter<"LicenseKey"> | boolean
    is_revoked?: BoolFilter<"LicenseKey"> | boolean
    created_at?: BigIntFilter<"LicenseKey"> | bigint | number
    updated_at?: BigIntFilter<"LicenseKey"> | bigint | number
    regenerated_at?: BigIntNullableFilter<"LicenseKey"> | bigint | number | null
    device_id?: StringNullableFilter<"LicenseKey"> | string | null
    last_reset_period?: StringNullableFilter<"LicenseKey"> | string | null
    reset_count?: IntFilter<"LicenseKey"> | number
  }

  export type SecretKeyLicenseCreateWithoutLicense_keyInput = {
    id?: bigint | number
    product_id: string
    key: string
    app_name: string
    created_at: bigint | number
    regenerated_at?: bigint | number | null
  }

  export type SecretKeyLicenseUncheckedCreateWithoutLicense_keyInput = {
    id?: bigint | number
    product_id: string
    key: string
    app_name: string
    created_at: bigint | number
    regenerated_at?: bigint | number | null
  }

  export type SecretKeyLicenseCreateOrConnectWithoutLicense_keyInput = {
    where: SecretKeyLicenseWhereUniqueInput
    create: XOR<SecretKeyLicenseCreateWithoutLicense_keyInput, SecretKeyLicenseUncheckedCreateWithoutLicense_keyInput>
  }

  export type SecretKeyLicenseUpsertWithoutLicense_keyInput = {
    update: XOR<SecretKeyLicenseUpdateWithoutLicense_keyInput, SecretKeyLicenseUncheckedUpdateWithoutLicense_keyInput>
    create: XOR<SecretKeyLicenseCreateWithoutLicense_keyInput, SecretKeyLicenseUncheckedCreateWithoutLicense_keyInput>
    where?: SecretKeyLicenseWhereInput
  }

  export type SecretKeyLicenseUpdateToOneWithWhereWithoutLicense_keyInput = {
    where?: SecretKeyLicenseWhereInput
    data: XOR<SecretKeyLicenseUpdateWithoutLicense_keyInput, SecretKeyLicenseUncheckedUpdateWithoutLicense_keyInput>
  }

  export type SecretKeyLicenseUpdateWithoutLicense_keyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    product_id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    app_name?: StringFieldUpdateOperationsInput | string
    created_at?: BigIntFieldUpdateOperationsInput | bigint | number
    regenerated_at?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  }

  export type SecretKeyLicenseUncheckedUpdateWithoutLicense_keyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    product_id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    app_name?: StringFieldUpdateOperationsInput | string
    created_at?: BigIntFieldUpdateOperationsInput | bigint | number
    regenerated_at?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  }

  export type LicenseKeyCreateManySecret_keyInput = {
    id?: string
    customer_id: string
    email: string
    code: string
    can_regenerate?: boolean
    is_revoked?: boolean
    created_at: bigint | number
    updated_at: bigint | number
    regenerated_at?: bigint | number | null
    device_id?: string | null
    last_reset_period?: string | null
    reset_count?: number
  }

  export type LicenseKeyUpdateWithoutSecret_keyInput = {
    id?: StringFieldUpdateOperationsInput | string
    customer_id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    can_regenerate?: BoolFieldUpdateOperationsInput | boolean
    is_revoked?: BoolFieldUpdateOperationsInput | boolean
    created_at?: BigIntFieldUpdateOperationsInput | bigint | number
    updated_at?: BigIntFieldUpdateOperationsInput | bigint | number
    regenerated_at?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    device_id?: NullableStringFieldUpdateOperationsInput | string | null
    last_reset_period?: NullableStringFieldUpdateOperationsInput | string | null
    reset_count?: IntFieldUpdateOperationsInput | number
  }

  export type LicenseKeyUncheckedUpdateWithoutSecret_keyInput = {
    id?: StringFieldUpdateOperationsInput | string
    customer_id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    can_regenerate?: BoolFieldUpdateOperationsInput | boolean
    is_revoked?: BoolFieldUpdateOperationsInput | boolean
    created_at?: BigIntFieldUpdateOperationsInput | bigint | number
    updated_at?: BigIntFieldUpdateOperationsInput | bigint | number
    regenerated_at?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    device_id?: NullableStringFieldUpdateOperationsInput | string | null
    last_reset_period?: NullableStringFieldUpdateOperationsInput | string | null
    reset_count?: IntFieldUpdateOperationsInput | number
  }

  export type LicenseKeyUncheckedUpdateManyWithoutSecret_keyInput = {
    id?: StringFieldUpdateOperationsInput | string
    customer_id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    can_regenerate?: BoolFieldUpdateOperationsInput | boolean
    is_revoked?: BoolFieldUpdateOperationsInput | boolean
    created_at?: BigIntFieldUpdateOperationsInput | bigint | number
    updated_at?: BigIntFieldUpdateOperationsInput | bigint | number
    regenerated_at?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    device_id?: NullableStringFieldUpdateOperationsInput | string | null
    last_reset_period?: NullableStringFieldUpdateOperationsInput | string | null
    reset_count?: IntFieldUpdateOperationsInput | number
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}