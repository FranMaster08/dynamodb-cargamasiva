import AWS from "aws-sdk";
import * as XLSX from "xlsx";
import { readFileSync, writeFileSync, readFile } from "node:fs";

AWS.config.update({ region: "us-east-1" });

const dynamodb = new AWS.DynamoDB();
const tableName = "prodblue-role-engine-CuitRoles";

const jsonData = JSON.parse(readFileSync("prueba2.json", "utf8"));
const jsonDataDelete = JSON.parse(readFileSync("resultado.json", "utf8"));
const listDatabase = JSON.parse(readFileSync("basecompleta.json", "utf8"));
const dataExcel = "cuits.xlsx";

// const analizeArrayPromise = (result, status) =>
//   result.filter((item) => item.status === status).map((item) => item.value);

//#region insertar masivamente
const insertDataOnDynamoDB = async (listCuit) => {
  const itemsToInsert = listCuit.map((item) => {
    const params = {
      TableName: tableName,
      Item: item,
    };
    return dynamodb.putItem(params).promise();
  });

  const result = await Promise.allSettled(itemsToInsert);
  const okresult = analizeArrayPromise(result, "fulfilled");
  const fails = analizeArrayPromise(result, "rejected");

  if (okresult.length > 0) {
    console.log("Elemento insertado con éxito los siguientes datos:");
    okresult.forEach(console.log);
  }

  if (failures.length > 0) {
    console.log("Fallo el insertado  siguientes datos:", fails);
    okresult.forEach(console.log);
  }
};
//#endregion

//#region buscar cuits iguales eliminarlos y generar nuevo Json

const searchAndSaveOnNewJson = (listCuit, listDatabase) => {
  const searchItems = listCuit
    .filter((item1) => {
      return listDatabase.some((item2) => item2.cuit === item1.cuit.S);
    })
    .map((item) => {
      const matchingItem = listDatabase.find((dbItem) => dbItem.cuit === item.cuit.S);

      return {
        cuit: { S: item.cuit.S },
        userId: { S: matchingItem.userId },
        roleId: { S: matchingItem.roleId},
      };
    });
  writeFileSync("resultado.json", JSON.stringify(searchItems, null, 2));
};

//#endregion

//#region eliminar items masivamente

const deleteItemsWithCuit = async (cuitList) => {
  const ItemsToDelete = cuitList.map((item) => {
    const params = {
      TableName: tableName,
      Key: {
        cuit: item.cuit,
        userId: item.userId,
      },
    };

    return dynamodb.deleteItem(params).promise();
  });

  try {
    const results = await Promise.all(ItemsToDelete);
    console.log(`Eliminados ${results.length} elementos de la tabla.`);
  } catch (error) {
    console.error("Error al eliminar elementos:", error);
  }
};

//#endregion

//#region convertir excel a json

const excelToJson = (excel) => {
  readFile(excel, (err, data) => {
    if (err) {
      console.error("Error al leer el archivo .xlsx:", err);
      return;
    }
    const xlsxtojson = XLSX.read(data, { type: "buffer" });
    const dataExceltToJson = XLSX.utils.sheet_to_json(xlsxtojson.Sheets[xlsxtojson.SheetNames[0]]);

    const jsonResult = dataExceltToJson
      .map((item) => {
        if (item.CUIT) {
          return {
            cuit: {
              S: item.CUIT.toString().toLowerCase(), // Asegúrate de que el campo 'cuit' sea de tipo String
            },
          };
        } else {
          throw new Error("No existe cuit");
        }
      })
      .filter((item) => item !== null);
    writeFileSync("databaseExcel.json", JSON.stringify(jsonResult, null, 2));

    console.log("Archivo JSON generado con éxito.");
  });
};

//#endregion

//#region buscar cuit

const traerUnCuit = async (cuit) => {
  const params = {
    TableName: tableName,
    Key: cuit,
  };
  const result = await dynamodb.getItem(params).promise();
  console.log(result.Item);
  //writeFileSync("allcuits.json", JSON.stringify(result, null, 2));
};
//#endregion

//#region  llamado a funciones

const listTableFromDynamo = async () => {
  try {
    const params = {
      TableName: tableName,
    };
    const data = await dynamodb.scan(params).promise();
    return data;
  } catch (error) {
    throw error;
  }
};

//insertDataOnDynamoDB(jsonData);
deleteItemsWithCuit(jsonDataDelete);
//searchAndSaveOnNewJson(jsonData, listDatabase);

// traerUnCuit({cuit: {"S": '23920587739'},
// userId: {
//   "S": "email|64d513752018da0206de815a"
// },});
//excelToJson(dataExcel);
// listTableFromDynamo()
//   .then((data) => {
//     console.log(JSON.stringify(data));
//   })
//   .catch(console.error);
//#endregion
