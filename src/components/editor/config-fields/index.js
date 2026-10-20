// Form fields component for each config type in config/configTypes.js
import RouteFields from './RouteFields.vue'
import LambdaFields from './LambdaFields.vue'
import HttpConnectorFields from './HttpConnectorFields.vue'
import MappingFields from './MappingFields.vue'
import SchemaFields from './SchemaFields.vue'
import SqsFields from './SqsFields.vue'
import SnsPublishFields from './SnsPublishFields.vue'
import DynamoDbFields from './DynamoDbFields.vue'
import MockFields from './MockFields.vue'

export const CONFIG_FIELDS = {
  route: RouteFields,
  lambda_function: LambdaFields,
  http_connector: HttpConnectorFields,
  mapping: MappingFields,
  schema: SchemaFields,
  sqs: SqsFields,
  sns_publish: SnsPublishFields,
  dynamodb: DynamoDbFields,
  mock: MockFields
}
