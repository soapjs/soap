import { Collection } from "./collection";
import { Mapper } from "./mapper";
import { QueryFactory } from "./query-factory";

export type DataContext<EntityType = unknown, ModelType = unknown> = {
  collection: Collection<ModelType>;
  mapper: Mapper<EntityType, ModelType>;
  queries: QueryFactory;
}