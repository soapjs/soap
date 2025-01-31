import { Where } from "../where";

describe("Where class", () => {
  test("should return condition for single isEq", () => {
    var where = new Where().valueOf("name").isEq("John");
    expect(where.build()).toEqual({
      left: "name",
      operator: "eq",
      right: "John",
    });
  });

  test("should return condition for chained conditions with and and or", () => {
    var where = new Where()
      .valueOf("name")
      .isEq("John")
      .and.valueOf("age")
      .isGt(25)
      .or.valueOf("cash")
      .isGt(2500);
    expect(where.build()).toEqual({
      conditions: [
        {
          conditions: [
            {
              left: "name",
              operator: "eq",
              right: "John",
            },
            {
              left: "age",
              operator: "gt",
              right: 25,
            },
          ],
          operator: "and",
        },
        {
          left: "cash",
          operator: "gt",
          right: 2500,
        },
      ],
      operator: "or",
    });
  });

  test("should return condition for chained conditions with or and and", () => {
    var where = new Where()
      .valueOf("name")
      .or.valueOf("last_name")
      .isEq("John")
      .and.valueOf("age")
      .isGt(25);
    expect(where.build()).toEqual({
      conditions: [
        {
          conditions: [
            {
              left: "name",
              operator: "eq",
              right: "John",
            },
            {
              left: "last_name",
              operator: "eq",
              right: "John",
            },
          ],
          operator: "or",
        },
        {
          left: "age",
          operator: "gt",
          right: 25,
        },
      ],
      operator: "and",
    });
  });

  test("should return condition for multiple isEq with or operator", () => {
    var where = new Where().valueOf("age").isEq(18).or.isEq(25);
    expect(where.build()).toEqual({
      conditions: [
        {
          left: "age",
          operator: "eq",
          right: 18,
        },
        {
          left: "age",
          operator: "eq",
          right: 25,
        },
      ],
      operator: "or",
    });
  });

  test("should return condition with nested brackets and and operator", () => {
    var where = new Where()
      .brackets((w) => w.valueOf("age").isEq(18).or.isGt(25).or.isGt(125))
      .and.valueOf("name")
      .isEq("Anna");
    expect(where.build()).toEqual({
      conditions: [
        {
          conditions: [
            {
              left: "age",
              operator: "eq",
              right: 18,
            },
            {
              left: "age",
              operator: "gt",
              right: 25,
            },
            {
              left: "age",
              operator: "gt",
              right: 125,
            },
          ],
          operator: "or",
        },
        {
          left: "name",
          operator: "eq",
          right: "Anna",
        },
      ],
      operator: "and",
    });
  });

  test("should return condition with nested brackets and or operator", () => {
    var where = new Where()
      .valueOf("name")
      .isEq("Anna")
      .and.brackets((w) => w.valueOf("age").isEq(18).or.isGt(25).or.isGt(125));
    expect(where.build()).toEqual({
      conditions: [
        {
          left: "name",
          operator: "eq",
          right: "Anna",
        },
        {
          conditions: [
            {
              left: "age",
              operator: "eq",
              right: 18,
            },
            {
              left: "age",
              operator: "gt",
              right: 25,
            },
            {
              left: "age",
              operator: "gt",
              right: 125,
            },
          ],
          operator: "or",
        },
      ],
      operator: "and",
    });
  });
  test("should return condition for single isNotEq", () => {
    const where = new Where().valueOf("name").isNotEq("John");
    expect(where.build()).toEqual({
      left: "name",
      operator: "ne",
      right: "John",
    });
  });

  test("should return condition for single isLt", () => {
    const where = new Where().valueOf("age").isLt(30);
    expect(where.build()).toEqual({
      left: "age",
      operator: "lt",
      right: 30,
    });
  });

  test("should return condition for single isLte", () => {
    const where = new Where().valueOf("age").isLte(30);
    expect(where.build()).toEqual({
      left: "age",
      operator: "lte",
      right: 30,
    });
  });

  test("should return condition for single isGt", () => {
    const where = new Where().valueOf("age").isGt(18);
    expect(where.build()).toEqual({
      left: "age",
      operator: "gt",
      right: 18,
    });
  });

  test("should return condition for single isGte", () => {
    const where = new Where().valueOf("age").isGte(18);
    expect(where.build()).toEqual({
      left: "age",
      operator: "gte",
      right: 18,
    });
  });

  test("should return condition for single isIn", () => {
    const where = new Where().valueOf("age").isIn([18, 25, 30]);
    expect(where.build()).toEqual({
      left: "age",
      operator: "in",
      right: [18, 25, 30],
    });
  });

  test("should return condition for single isNotIn", () => {
    const where = new Where().valueOf("age").isNotIn([18, 25, 30]);
    expect(where.build()).toEqual({
      left: "age",
      operator: "nin",
      right: [18, 25, 30],
    });
  });

  test("should return condition for single like", () => {
    const where = new Where().valueOf("name").like("%John%");
    expect(where.build()).toEqual({
      left: "name",
      operator: "like",
      right: "%John%",
    });
  });
});
