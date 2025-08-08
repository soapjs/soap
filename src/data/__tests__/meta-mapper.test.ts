import "reflect-metadata";
import { MetaMapper } from "../meta-mapper";
import { TransformersMap } from "../property-transformer";
import { EntityProperty } from "../../domain/decorators";

describe("MetaMapper", () => {
  // Mock classes for testing
  class MockEntity {
    id: string;
    name: string;
    email: string;
    age: number;
    tags: string[];
    createdAt: Date;
    isActive: boolean;
  }

  class MockModel {
    @EntityProperty("id")
    _id: string;

    @EntityProperty("name", {
      transformer: {
        to: (value: string) => value ? value.toLowerCase() : value,
        from: (value: string) => value ? value.toUpperCase() : value
      }
    })
    user_name: string;

    @EntityProperty("email")
    user_email: string;

    @EntityProperty("age")
    user_age: number;

    @EntityProperty("tags")
    user_tags: string;

    @EntityProperty("createdAt")
    created_at: string;

    @EntityProperty("isActive")
    is_active: boolean;
  }

  // Common transformers for testing
  const commonTransformers: TransformersMap = {
    id: {
      to: (value: string) => `obj_${value}`,
      from: (value: string) => value ? value.replace("obj_", "") : value
    },
    tags: {
      to: (value: string[]) => value ? value.join(",") : "",
      from: (value: string) => value ? value.split(",") : []
    },
    createdAt: {
      to: (value: Date) => value ? value.toISOString() : null,
      from: (value: string) => value ? new Date(value) : null
    },
    age: {
      to: (value: number) => value ? value.toString() : "0",
      from: (value: string) => value ? parseInt(value, 10) : 0
    }
  };

  let mapper: MetaMapper<MockEntity, MockModel>;

  beforeEach(() => {
    mapper = new MetaMapper(MockEntity, MockModel, commonTransformers);
  });

  describe("constructor", () => {
    it("should create MetaMapper with entity class, model class and transformers", () => {
      expect(mapper).toBeDefined();
      expect(mapper.transformers).toBe(commonTransformers);
    });

    it("should create MetaMapper without transformers", () => {
      const mapperWithoutTransformers = new MetaMapper(MockEntity, MockModel);
      expect(mapperWithoutTransformers).toBeDefined();
      expect(mapperWithoutTransformers.transformers).toBeUndefined();
    });
  });

  describe("toEntity", () => {
    it("should convert model to entity using decorator transformers", () => {
      const model: MockModel = {
        _id: "123",
        user_name: "john",
        user_email: "john@example.com",
        user_age: 25,
        user_tags: "tag1,tag2,tag3",
        created_at: "2023-01-01T00:00:00.000Z",
        is_active: true
      };

      const entity = mapper.toEntity(model);

      expect(entity.id).toBe("123"); // using common transformer
      expect(entity.name).toBe("JOHN"); // using decorator transformer (from)
      expect(entity.email).toBe("john@example.com"); // no transformer
      expect(entity.age).toBe(25); // using common transformer
      expect(entity.tags).toEqual(["tag1", "tag2", "tag3"]); // using common transformer
      expect(entity.createdAt).toEqual(new Date("2023-01-01T00:00:00.000Z")); // using common transformer
      expect(entity.isActive).toBe(true); // no transformer
    });

    it("should prioritize decorator transformers over common transformers", () => {
      // Add a conflicting transformer for 'name' in common transformers
      const conflictingTransformers: TransformersMap = {
        ...commonTransformers,
        name: {
          from: (value: string) => `COMMON_${value}`
        }
      };

      const mapperWithConflict = new MetaMapper(MockEntity, MockModel, conflictingTransformers);
      
      const model: MockModel = {
        _id: "123",
        user_name: "john",
        user_email: "john@example.com",
        user_age: 25,
        user_tags: "tag1,tag2",
        created_at: "2023-01-01T00:00:00.000Z",
        is_active: true
      };

      const entity = mapperWithConflict.toEntity(model);

      // Should use decorator transformer, not common transformer
      expect(entity.name).toBe("JOHN"); // decorator: toUpperCase
      // NOT "COMMON_john" from common transformer
    });

    it("should handle missing transformers gracefully", () => {
      const mapperWithoutTransformers = new MetaMapper(MockEntity, MockModel);
      
      const model: MockModel = {
        _id: "123",
        user_name: "john",
        user_email: "john@example.com",
        user_age: 25,
        user_tags: "tag1,tag2",
        created_at: "2023-01-01T00:00:00.000Z",
        is_active: true
      };

      const entity = mapperWithoutTransformers.toEntity(model);

      expect(entity.id).toBe("123"); // no transformer, direct assignment
      expect(entity.name).toBe("JOHN"); // still uses decorator transformer
      expect(entity.email).toBe("john@example.com");
      expect(entity.age).toBe(25); // no transformer, stays as string
    });

    it("should pass context to transformers", () => {
      const contextSpy = jest.fn();
      const mapperWithSpy = new MetaMapper(MockEntity, MockModel, {
        id: {
          from: (value, context) => {
            contextSpy(context);
            return value;
          }
        }
      });

      const model: MockModel = {
        _id: "123",
        user_name: "john",
        user_email: "john@example.com",
        user_age: 25,
        user_tags: "tag1,tag2",
        created_at: "2023-01-01T00:00:00.000Z",
        is_active: true
      };

      const args = ["test", "args"];
      mapperWithSpy.toEntity(model, ...args);

      expect(contextSpy).toHaveBeenCalledWith({
        model,
        entity: expect.any(Object),
        args
      });
    });

    it("should handle empty model", () => {
      const entity = mapper.toEntity({} as MockModel);
      expect(entity).toEqual({});
    });
  });

  describe("toModel", () => {
    it("should convert entity to model using decorator transformers", () => {
      const entity: MockEntity = {
        id: "123",
        name: "JOHN",
        email: "john@example.com",
        age: 25,
        tags: ["tag1", "tag2", "tag3"],
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        isActive: true
      };

      const model = mapper.toModel(entity);

      expect(model._id).toBe("obj_123"); // using common transformer (to)
      expect(model.user_name).toBe("john"); // using decorator transformer (to)
      expect(model.user_email).toBe("john@example.com"); // no transformer
      expect(model.user_age).toBe("25"); // using common transformer (to)
      expect(model.user_tags).toBe("tag1,tag2,tag3"); // using common transformer (to)
      expect(model.created_at).toBe("2023-01-01T00:00:00.000Z"); // using common transformer (to)
      expect(model.is_active).toBe(true); // no transformer
    });

    it("should prioritize decorator transformers over common transformers", () => {
      const conflictingTransformers: TransformersMap = {
        ...commonTransformers,
        name: {
          to: (value: string) => `COMMON_${value}`
        }
      };

      const mapperWithConflict = new MetaMapper(MockEntity, MockModel, conflictingTransformers);
      
      const entity: MockEntity = {
        id: "123",
        name: "JOHN",
        email: "john@example.com",
        age: 25,
        tags: ["tag1", "tag2"],
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        isActive: true
      };

      const model = mapperWithConflict.toModel(entity);

      // Should use decorator transformer, not common transformer
      expect(model.user_name).toBe("john"); // decorator: toLowerCase
      // NOT "COMMON_JOHN" from common transformer
    });

    it("should handle missing transformers gracefully", () => {
      const mapperWithoutTransformers = new MetaMapper(MockEntity, MockModel);
      
      const entity: MockEntity = {
        id: "123",
        name: "JOHN",
        email: "john@example.com",
        age: 25,
        tags: ["tag1", "tag2"],
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        isActive: true
      };

      const model = mapperWithoutTransformers.toModel(entity);

      expect(model._id).toBe("123"); // no transformer, direct assignment
      expect(model.user_name).toBe("john"); // still uses decorator transformer
      expect(model.user_email).toBe("john@example.com");
      expect(model.user_age).toBe(25); // no transformer, stays as number
    });

    it("should pass context to transformers", () => {
      const contextSpy = jest.fn();
      const mapperWithSpy = new MetaMapper(MockEntity, MockModel, {
        id: {
          to: (value, context) => {
            contextSpy(context);
            return value;
          }
        }
      });

      const entity: MockEntity = {
        id: "123",
        name: "JOHN",
        email: "john@example.com",
        age: 25,
        tags: ["tag1", "tag2"],
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        isActive: true
      };

      const args = ["test", "args"];
      mapperWithSpy.toModel(entity, ...args);

      expect(contextSpy).toHaveBeenCalledWith({
        entity,
        model: expect.any(Object),
        args
      });
    });

    it("should handle empty entity", () => {
      const model = mapper.toModel({} as MockEntity);
      expect(model).toEqual({});
    });
  });

  describe("edge cases", () => {
    it("should handle null and undefined values", () => {
      const model: Partial<MockModel> = {
        _id: null as any,
        user_name: undefined as any,
        user_email: "test@example.com"
      };

      const entity = mapper.toEntity(model as MockModel);

      expect(entity.id).toBeNull();
      expect(entity.name).toBeUndefined();
      expect(entity.email).toBe("test@example.com");
    });

    it("should handle transformer throwing error", () => {
      const errorTransformers: TransformersMap = {
        id: {
          from: () => {
            throw new Error("Transformer error");
          }
        }
      };

      const mapperWithError = new MetaMapper(MockEntity, MockModel, errorTransformers);
      
      const model: MockModel = {
        _id: "123",
        user_name: "john",
        user_email: "john@example.com",
        user_age: 25,
        user_tags: "tag1,tag2",
        created_at: "2023-01-01T00:00:00.000Z",
        is_active: true
      };

      expect(() => mapperWithError.toEntity(model)).toThrow("Transformer error");
    });

    it("should handle model without decorators", () => {
      class PlainModel {
        id: string;
        name: string;
      }

      const plainMapper = new MetaMapper(MockEntity, PlainModel);
      
      const model = { id: "123", name: "john" };
      const entity = plainMapper.toEntity(model);

      // Should return empty object since no decorators to map
      expect(entity).toEqual({});
    });

    it("should handle complex nested transformations", () => {
      const nestedTransformers: TransformersMap = {
        tags: {
          to: (value: string[]) => JSON.stringify(value),
          from: (value: string) => JSON.parse(value)
        }
      };

      const nestedMapper = new MetaMapper(MockEntity, MockModel, nestedTransformers);
      
      const originalTags = ["tag1", "tag2", { nested: "value" }];
      const model: Partial<MockModel> = {
        user_tags: JSON.stringify(originalTags)
      };

      const entity = nestedMapper.toEntity(model as MockModel);
      expect(entity.tags).toEqual(originalTags);

      const backToModel = nestedMapper.toModel(entity);
      expect(backToModel.user_tags).toBe(JSON.stringify(originalTags));
    });
  });

  describe("performance", () => {
    it("should handle large objects efficiently", () => {
      const start = performance.now();
      
      const largeModel: MockModel = {
        _id: "123",
        user_name: "john",
        user_email: "john@example.com",
        user_age: 25,
        user_tags: "tag1,tag2,tag3",
        created_at: "2023-01-01T00:00:00.000Z",
        is_active: true
      };

      // Run transformation 1000 times
      for (let i = 0; i < 1000; i++) {
        const entity = mapper.toEntity(largeModel);
        mapper.toModel(entity);
      }

      const end = performance.now();
      const duration = end - start;

      // Should complete 1000 transformations in reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});