const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const dynamodb = new AWS.DynamoDB.DocumentClient();
const table = "prodblue-role-engine-CuitRoles";
const fs = require("fs");

const dataFull = () => {
  const data = fs
    .readFileSync("dataCuits.txt", "utf8")
    .split("\n")
    .filter((item) => item);

  return data;
};

const scanDynamoDBTable = async (tableName) => {
  const params = {
    TableName: tableName,
  };

  const allItems = [];
  let lastEvaluatedKey = null;

  do {
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    try {
      const scanResult = await dynamodb.scan(params).promise();
      allItems.push(...scanResult.Items);
      lastEvaluatedKey = scanResult.LastEvaluatedKey;
    } catch (error) {
      console.error("Error al escanear la tabla:", error);
      throw error;
    }
  } while (lastEvaluatedKey);

  return allItems;
};

const main = async () => {
  try {
    const itemsInTable = await scanDynamoDBTable(table);
    for (let index = 0; index < itemsInTable.length; index++) {
      const element = itemsInTable[index];
      console.log(element, ",");
    }

    return;
    const data = dataFull();

    const valoresNoEncontrados = data.filter((valor) => {
      const encontrado = itemsInTable.some((item) => item.cuit === valor);
      return !encontrado;
    });

    if (valoresNoEncontrados.length > 0) {
      console.log("Valores no encontrados en la tabla:", valoresNoEncontrados);
    } else {
      console.log("Todos los valores están en la tabla.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

main();
