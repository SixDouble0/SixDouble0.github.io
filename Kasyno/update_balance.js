const fs = require('fs');
const path = require('path');


const dbFilePath = path.join(__dirname, 'db.json');

const updateBalances = () => {

    const db = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));

    db.users = db.users.map(user => ({
        ...user,
        balance: 1000
    }));


    fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2));

    console.log('Salda zostały zaktualizowane.');
};

updateBalances();

//json-server json-server --watch db.json komenda na server