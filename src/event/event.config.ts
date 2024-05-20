export interface EventConfig {
  type: string; // "rabbitmq" | "kafka";
  url?: string;
  brokers?: string[];
  clientId?: string;
  groupId?: string;
  [key: string]: unknown;
}
