const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const dynamodb = new AWS.DynamoDB();
const table = "prodblue-role-engine-CuitRoles";
const fs = require("fs");
const { exit } = require("process");

const dataFull = () => {
  const data = fs
    .readFileSync("dataCuits.txt", "utf8")
    .split("\n") // Cambié "/n" a "\n" para separar las líneas correctamente
    .filter((item) => item);

  return data;
};

const buscarUnElementoEnLaTabla = () => {
  return new Promise((resolve, reject) => {
    dynamodb.scan(
      {
        TableName: table,
      },
      (err, data) => {
        if (err) return reject(err);
        resolve(data);
      }
    );
  });
};

buscarUnElementoEnLaTabla()
  .then(({ Items }) => {
    fs.writeFileSync('datosBaseDatos.json',JSON.stringify(Items), 'utf8');
  })
  .catch(console.log);