import express from 'express';
import dotenv from 'dotenv';
import pool from './db/pool.js';


const app = express();
const port = 3000;
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World");
});


//Create a product. Adds the product to the database
app.post('/create_product', (req, res) => {
    var data = req.body;
    try {
        var upc = data.upc;
        pool.query("SELECT * FROM product WHERE productupc = $1", [data.productupc]).then(result => {
            if (result.rows.length === 0) {
                console.log("UPC Unique!");
                try {
                    var query = `INSERT INTO PRODUCT (productsku, productname, productcost, productprice, productupc, productdescription, inventorycount, itemstatus) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
                    var values = [data.productsku, data.productname, data.productcost, data.productprice, data.productupc, data.productdescription, data.productinventory, data.productstatus];
                    pool.query(query, values);
                    res.send("Product Added Successfully!");

                } catch (err) {
                    console.log("Error with Query, please try again!" + err);
                }
            } else {
                console.log("No results found");
                res.send("Cannot Add, UPC already in use!");
                return;
            }
        });
    } catch (err) {
        console.log("error: " + err);
    }

})
//Will need employee name, username, pin, and level (A= Admin/Owner, M=Manager, C=Cashier);
app.post('/add_employee', async (req, res) => {
    var data = req.body;
    var employeeID = data['employeeID'];
    var employeeName = data['employeeName'];
    var employeeUsername = data['employeeUsername'];
    var employeePin = data['employeePin'];
    var employeeLevel = String.fromCharCode(data['employeeLevel']);


    pool.query(
        "INSERT INTO employee (employeeID, employeeName, employeeUsername, employeePin, employeeLevel) VALUES ($1,$2,$3,$4,$5)",
        [employeeID, employeeName, employeeUsername, employeePin, employeeLevel]
    )
        .then(result => {
            console.log("Insert successful");
            res.send("employee added successfully!");
        })
        .catch(err => {
            console.error("Error inserting employee:", err);
            res.send(err);

        });
    console.log(err);
});
//Send a JSON object with the new employee data and update the corresponding data
app.post('/update_employee', async (req, res) => {

})
//Send a JSON object with products
app.post('/make_sale', async (req, res) => {
    var data = req.body;
    var timestamp = data.timestamp;
    var products = data.products;
    var saleAmount = data.total;
    var method = data.method; //paymentMethod
    var saleId = data.id;



    try {
        var query = `INSERT INTO sale (saleid, saledate, saleamount, paymentmethod) VALUES ($1, $2, $3, $4)`;
        var values = [saleId, timestamp, saleAmount, method];
        pool.query(query, values);
        for (var product of data.products) {
            console.log(product.sku);
            var query_for_sales_item = `INSERT INTO sale_item (saleid, itemname, productsku, itemcount) VALUES ($1, (SELECT productname FROM product WHERE productsku=$2),$2,$3)`;
            var query_values = [saleId, product.sku, 1];
            try {
                pool.query(query_for_sales_item, query_values);

            } catch (err) {
                console.log(err);
            }
        }

    } catch (err) {
        console.log(err);
    }




})

app.post('/create_clockin', async (req, res) => {
});


app.get("/get_inventory", async (req, res) => {
    console.log("Call received!");
    try {
        var result = await pool.query("SELECT * FROM PRODUCT;");
        console.log(result.rows);
        if (result.rows.length == 0) {
            res.send("No Data in Database!");
        } else {
            res.json(result.rows);
        }
    } catch (err) {
        console.log(err);
    }
});

app.get("/get_new_sku", async (req, res) => {
    console.log("SKU REQUEST");
    try {
        const result = await pool.query(
            "SELECT currentsku FROM SKU_COUNTER WHERE entryId = 1;"
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "SKU not found" });
        }
        let currentSku = result.rows[0].currentsku;
        const newSku = currentSku + 1;
        await pool.query(
            "UPDATE SKU_COUNTER SET currentsku = $1 WHERE entryId = 1;",
            [newSku]
        );

        res.send(currentSku);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});


app.get("/get_sales_data", async (req, res) => {

});



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});