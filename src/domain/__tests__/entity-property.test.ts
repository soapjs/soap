import "reflect-metadata";
import { EntityProperty, EntityPropertyOptions, PropertyResolver } from "../decorators";

describe("EntityProperty decorator", () => {
  describe("basic functionality", () => {
    it("should store domain field name metadata", () => {
      class TestModel {
        @EntityProperty("domainId")
        db_id: string;
      }

      const instance = new TestModel();
      const metadata = Reflect.getMetadata("entityProperty", instance, "db_id");

      expect(metadata).toBeDefined();
      expect(metadata.name).toBe("domainId");
      expect(metadata.type).toBe("String");
    });

    it("should infer type from TypeScript reflection", () => {
      class TestModel {
        @EntityProperty("userId")
        user_id: number;

        @EntityProperty("isActive")
        is_active: boolean;

        @EntityProperty("metadata")
        user_metadata: object;
      }

      const instance = new TestModel();
      
      const userIdMeta = Reflect.getMetadata("entityProperty", instance, "user_id");
      expect(userIdMeta.type).toBe("Number");

      const isActiveMeta = Reflect.getMetadata("entityProperty", instance, "is_active");
      expect(isActiveMeta.type).toBe("Boolean");

      const metadataMeta = Reflect.getMetadata("entityProperty", instance, "user_metadata");
      expect(metadataMeta.type).toBe("Object");
    });
  });

  describe("type reference functionality", () => {
    it("should accept constructor functions as type", () => {
      class CustomType {
        constructor(public value: string) {}
      }

      class TestModel {
        @EntityProperty("customField", {
          type: CustomType
        })
        custom_field: string;
      }

      const instance = new TestModel();
      const metadata = Reflect.getMetadata("entityProperty", instance, "custom_field");

      expect(metadata.type).toBe(CustomType);
      expect(metadata.name).toBe("customField");
    });

    it("should accept built-in constructors as type", () => {
      class TestModel {
        @EntityProperty("dateField", {
          type: Date
        })
        date_field: string;

        @EntityProperty("numberField", {
          type: Number
        })
        number_field: string;

        @EntityProperty("stringField", {
          type: String
        })
        string_field: string;
      }

      const instance = new TestModel();
      
      const dateMeta = Reflect.getMetadata("entityProperty", instance, "date_field");
      expect(dateMeta.type).toBe(Date);

      const numberMeta = Reflect.getMetadata("entityProperty", instance, "number_field");
      expect(numberMeta.type).toBe(Number);

      const stringMeta = Reflect.getMetadata("entityProperty", instance, "string_field");
      expect(stringMeta.type).toBe(String);
    });

    it("should accept string types as before", () => {
      class TestModel {
        @EntityProperty("objectIdField", {
          type: "ObjectId"
        })
        object_id_field: string;
      }

      const instance = new TestModel();
      const metadata = Reflect.getMetadata("entityProperty", instance, "object_id_field");

      expect(metadata.type).toBe("ObjectId");
      expect(metadata.name).toBe("objectIdField");
    });

    it("should prioritize provided type over reflected type", () => {
      class CustomType {
        constructor(public value: string) {}
      }

      class TestModel {
        @EntityProperty("field", {
          type: CustomType
        })
        field: string; // TypeScript type is string, but we specify CustomType
      }

      const instance = new TestModel();
      const metadata = Reflect.getMetadata("entityProperty", instance, "field");

      expect(metadata.type).toBe(CustomType); // Should use provided type
      expect(metadata.name).toBe("field");
    });
  });

  describe("options functionality", () => {
    it("should store all property options", () => {
      const transformer = {
        to: (value: string) => value.toLowerCase(),
        from: (value: string) => value.toUpperCase()
      };

      class TestModel {
        @EntityProperty("userEmail", {
          type: "email",
          default: "noemail@example.com",
          nullable: false,
          unique: true,
          index: true,
          transformer
        })
        email: string;
      }

      const instance = new TestModel();
      const metadata = Reflect.getMetadata("entityProperty", instance, "email");

      expect(metadata).toEqual({
        name: "userEmail",
        type: "email",
        default: "noemail@example.com",
        nullable: false,
        unique: true,
        index: true,
        transformer
      });
    });

    it("should handle partial options", () => {
      class TestModel {
        @EntityProperty("userName", {
          nullable: true,
          default: "anonymous"
        })
        name: string;
      }

      const instance = new TestModel();
      const metadata = Reflect.getMetadata("entityProperty", instance, "name");

      expect(metadata.name).toBe("userName");
      expect(metadata.type).toBe("String");
      expect(metadata.nullable).toBe(true);
      expect(metadata.default).toBe("anonymous");
      expect(metadata.unique).toBeUndefined();
      expect(metadata.index).toBeUndefined();
      expect(metadata.transformer).toBeUndefined();
    });

    it("should override inferred type when provided", () => {
      class TestModel {
        @EntityProperty("objectId", {
          type: "ObjectId"
        })
        _id: string; // TypeScript type is string, but we specify ObjectId
      }

      const instance = new TestModel();
      const metadata = Reflect.getMetadata("entityProperty", instance, "_id");

      expect(metadata.type).toBe("ObjectId"); // Should use provided type
      expect(metadata.name).toBe("objectId");
    });
  });

  describe("transformer functionality", () => {
    it("should store transformer functions", () => {
      const toFn = jest.fn((value: string) => value.toLowerCase());
      const fromFn = jest.fn((value: string) => value.toUpperCase());

      class TestModel {
        @EntityProperty("userName", {
          transformer: {
            to: toFn,
            from: fromFn
          }
        })
        name: string;
      }

      const instance = new TestModel();
      const metadata = Reflect.getMetadata("entityProperty", instance, "name");

      expect(metadata.transformer).toBeDefined();
      expect(metadata.transformer.to).toBe(toFn);
      expect(metadata.transformer.from).toBe(fromFn);

      // Test that functions work
      expect(metadata.transformer.to("TEST")).toBe("test");
      expect(metadata.transformer.from("test")).toBe("TEST");
      expect(toFn).toHaveBeenCalledWith("TEST");
      expect(fromFn).toHaveBeenCalledWith("test");
    });

    it("should handle transformer with only 'to' function", () => {
      class TestModel {
        @EntityProperty("timestamp", {
          transformer: {
            to: (value: Date) => value.toISOString()
          }
        })
        created_at: Date;
      }

      const instance = new TestModel();
      const metadata = Reflect.getMetadata("entityProperty", instance, "created_at");

      expect(metadata.transformer.to).toBeDefined();
      expect(metadata.transformer.from).toBeUndefined();
    });

    it("should handle transformer with only 'from' function", () => {
      class TestModel {
        @EntityProperty("timestamp", {
          transformer: {
            from: (value: string) => new Date(value)
          }
        })
        created_at: Date;
      }

      const instance = new TestModel();
      const metadata = Reflect.getMetadata("entityProperty", instance, "created_at");

      expect(metadata.transformer.from).toBeDefined();
      expect(metadata.transformer.to).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle unknown type when reflection fails", () => {
      // Mock reflection to return undefined
      const originalGetMetadata = Reflect.getMetadata;
      jest.spyOn(Reflect, "getMetadata").mockImplementation((key, target, propertyKey) => {
        if (key === "design:type") {
          return undefined;
        }
        return originalGetMetadata(key, target, propertyKey);
      });

      class TestModel {
        @EntityProperty("unknownField")
        someField: any;
      }

      const instance = new TestModel();
      const metadata = Reflect.getMetadata("entityProperty", instance, "someField");

      expect(metadata.type).toBe("unknown");

      // Restore original implementation
      jest.restoreAllMocks();
    });

    it("should handle empty options object", () => {
      class TestModel {
        @EntityProperty("testField", {})
        field: string;
      }

      const instance = new TestModel();
      const metadata = Reflect.getMetadata("entityProperty", instance, "field");

      expect(metadata.name).toBe("testField");
      expect(metadata.type).toBe("String");
      expect(metadata.default).toBeUndefined();
      expect(metadata.nullable).toBeUndefined();
      expect(metadata.unique).toBeUndefined();
      expect(metadata.index).toBeUndefined();
      expect(metadata.transformer).toBeUndefined();
    });

    it("should handle multiple properties on same class", () => {
      class TestModel {
        @EntityProperty("userId")
        id: string;

        @EntityProperty("userName", { nullable: true })
        name: string;

        @EntityProperty("userAge", { type: "integer", default: 0 })
        age: number;
      }

      const instance = new TestModel();
      
      const idMeta = Reflect.getMetadata("entityProperty", instance, "id");
      const nameMeta = Reflect.getMetadata("entityProperty", instance, "name");
      const ageMeta = Reflect.getMetadata("entityProperty", instance, "age");

      expect(idMeta.name).toBe("userId");
      expect(nameMeta.name).toBe("userName");
      expect(nameMeta.nullable).toBe(true);
      expect(ageMeta.name).toBe("userAge");
      expect(ageMeta.type).toBe("integer");
      expect(ageMeta.default).toBe(0);
    });
  });

  describe("integration with PropertyResolver", () => {
    class UserModel {
      @EntityProperty("userId", {
        type: "ObjectId",
        unique: true
      })
      _id: string;

      @EntityProperty("userName", {
        nullable: false,
        default: "Anonymous",
        transformer: {
          to: (value: string) => value.toLowerCase(),
          from: (value: string) => value.toUpperCase()
        }
      })
      name: string;

      @EntityProperty("userEmail", {
        unique: true,
        index: true
      })
      email: string;
    }

    let resolver: PropertyResolver<UserModel>;

    beforeEach(() => {
      resolver = new PropertyResolver(UserModel);
    });

    it("should resolve field by domain name", () => {
      const fieldInfo = resolver.resolveDatabaseField("userId");

      expect(fieldInfo).toBeDefined();
      expect(fieldInfo!.name).toBe("userId");
      expect(fieldInfo!.type).toBe("ObjectId");
      expect(fieldInfo!.unique).toBe(true);
      expect(fieldInfo!.modelFieldName).toBe("_id");
    });

    it("should resolve field by model field name", () => {
      const fieldInfo = resolver.resolveByModelField("name");

      expect(fieldInfo).toBeDefined();
      expect(fieldInfo!.name).toBe("userName");
      expect(fieldInfo!.nullable).toBe(false);
      expect(fieldInfo!.default).toBe("Anonymous");
      expect(fieldInfo!.transformer).toBeDefined();
      expect(fieldInfo!.domainFieldName).toBe("userName");
    });

    it("should get all property mappings", () => {
      const mappings = resolver.getAllPropertyMappings();

      expect(mappings).toHaveLength(3);
      
      const idMapping = mappings.find(m => m.modelFieldName === "_id");
      const nameMapping = mappings.find(m => m.modelFieldName === "name");
      const emailMapping = mappings.find(m => m.modelFieldName === "email");

      expect(idMapping).toBeDefined();
      expect(idMapping!.domainFieldName).toBe("userId");
      expect(idMapping!.type).toBe("ObjectId");

      expect(nameMapping).toBeDefined();
      expect(nameMapping!.domainFieldName).toBe("userName");
      expect(nameMapping!.transformer).toBeDefined();

      expect(emailMapping).toBeDefined();
      expect(emailMapping!.domainFieldName).toBe("userEmail");
      expect(emailMapping!.unique).toBe(true);
      expect(emailMapping!.index).toBe(true);
    });

    it("should return undefined for non-existent domain field", () => {
      const fieldInfo = resolver.resolveDatabaseField("nonExistentField");
      expect(fieldInfo).toBeUndefined();
    });

    it("should return undefined for non-existent model field", () => {
      const fieldInfo = resolver.resolveByModelField("nonExistentField");
      expect(fieldInfo).toBeUndefined();
    });
  });
});