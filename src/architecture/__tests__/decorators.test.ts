import { EntityField, FieldResolver } from "../decorators";


describe("FieldResolver", () => {
  class ObjectId {}
  class TestModel {
    @EntityField("domainId")
    db_id: ObjectId;

    @EntityField("domainName")
    db_name: string;
  }

  const resolver = new FieldResolver(TestModel);

  it("should resolve the correct database field name and type from a domain field name", () => {
    const result = resolver.resolveDatabaseField("domainId");
    expect(result?.name).toBe("db_id");
    expect(result?.type).toBe("ObjectId");
  });

  it("should return undefined if the domain field name does not exist", () => {
    expect(resolver.resolveDatabaseField("nonExistingField")).toBeUndefined();
  });
});
