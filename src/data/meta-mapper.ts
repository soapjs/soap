import { PropertyResolver } from "../domain/decorators";
import { ConstructorOf, PropertyInfo } from "../types";
import { Mapper } from "./mapper";
import { TransformersMap } from "./property-transformer";

/**
 * MetaMapper is a mapper that uses decorators to resolve property names and transformers.
 * It is used to map between the EntityType and the ModelType.
 * 
 * @template EntityType - The type of the entity.
 * @template ModelType - The type of the model.
 * @param {new () => EntityType} entityClass - The class of the entity.
 * @param {new () => ModelType} modelClass - The class of the model.
 * @param {TransformersMap} transformers - The transformers for the mapper.
 */
export class MetaMapper<EntityType, ModelType> implements Mapper<EntityType, ModelType> {
  private modelPropertyResolver: PropertyResolver<ModelType>;
  private fieldMappings: Map<string, PropertyInfo & { domainName: string }> = new Map();
  
  constructor(
    entityClass: ConstructorOf<EntityType>,
    modelClass: ConstructorOf<ModelType>,
    public transformers?: TransformersMap
  ) {
    // TODO: think about PropertyResolver for entityClass
    this.modelPropertyResolver = new PropertyResolver(modelClass);
    this.initializeFieldMappings();
  }

  private initializeFieldMappings(): void {
    const mappings = this.modelPropertyResolver.getAllPropertyMappings();
    for (const mapping of mappings) {
      this.fieldMappings.set(mapping.modelFieldName, {
        ...mapping,
        domainName: mapping.domainFieldName
      });
    }
  }

  toEntity(model: ModelType, ...args: any[]): EntityType {
    const entity = {} as EntityType;
    
    for (const [modelKey, value] of Object.entries(model as object)) {
      const fieldInfo = this.fieldMappings.get(modelKey);
      
      if (fieldInfo) {
        const domainKey = fieldInfo.domainName;
        let transformedValue = value;

        if (fieldInfo.transformer?.from) {
          transformedValue = fieldInfo.transformer.from(value, { model, entity, args });
        }

        else if (this.transformers?.[domainKey]?.from) {
          transformedValue = this.transformers[domainKey].from(value, { model, entity, args });
        }

        entity[domainKey] = transformedValue;
      }
    }

    return entity;
  }

  toModel(entity: EntityType, ...args: any[]): ModelType {
    const model = {} as ModelType;
    
    for (const [domainKey, value] of Object.entries(entity as object)) {
      const fieldInfo = this.modelPropertyResolver.resolveDatabaseField(domainKey);
      
      if (fieldInfo) {
        const modelKey = fieldInfo.modelFieldName;
        let transformedValue = value;

        if (fieldInfo.transformer?.to) {
          transformedValue = fieldInfo.transformer.to(value, { entity, model, args });
        }

        else if (this.transformers?.[domainKey]?.to) {
          transformedValue = this.transformers[domainKey].to(value, { entity, model, args });
        }

        model[modelKey] = transformedValue;
      }
    }

    return model;
  }

  private getFieldInfoByModelKey(modelKey: string): PropertyInfo & { domainName: string } | undefined {
    return this.fieldMappings.get(modelKey);
  }
}