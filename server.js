
import express from 'express';
import dotenv from 'dotenv';
import pool from './db/pool.js';


const app = express();
const port = 3000;
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World, sever running");
});


//Create a product. Adds the product to the database
app.post('/create_product', (req, res) => {
    var data = req.body;
    console.log(data);
    try {
        var upc = data.upc;
        pool.query("SELECT * FROM product WHERE productupc = $1", [data.productupc]).then(result => {
            if (result.rows.length === 0) {
                console.log("UPC Unique!");
                try {
                    var query = `INSERT INTO PRODUCT (productsku, productname, productcost, productprice, productupc, productdescription, inventorycount, itemstatus) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
                    var values = [data.productsku, data.productname, data.productcost, data.productprice, BigInt(data.productupc), data.productdescription, data.productinventory, data.productstatus];
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

app.post('/update_product', (req, res) => {
    var data = req.body;
    console.log(data);
    try {
        var upc = BigInt(data.productupc);
        console.log(upc);
        pool.query("SELECT * FROM product WHERE productupc = $1  AND productsku <> $2", [data.productupc, data.productsku]).then(result => {
            if (result.rows.length === 0) {
                console.log("UPC Unique!");
                try {
                    var query = "UPDATE product SET productname = $1, productcost = $2, productprice = $3, productupc = $4, productdescription = $5, inventorycount = $6, itemstatus = $7 WHERE productsku = $8";
                    var values = [data.productname, data.productcost, data.productprice, BigInt(data.productupc), data.productdescription, data.productinventory, data.productstatus, data.productsku];
                    pool.query(query, values);
                    res.send("success");

                } catch (err) {
                    console.log("Error with Query, please try again!" + err);
                }
            } else {
                console.log("No results found");
                res.send("upc_error");
                return;
            }
        });
    } catch (err) {
        res.send(err);
        console.log("error: " + err);
    }

})
//TEMP DELETE ALL PRODUCTS
app.get('/wipe_products', async (req, res) => {
    try {
        await pool.query("DELETE FROM PRODUCT;");
        res.send("All products deleted.");
    } catch (err) {
        console.log("Error deleting products: " + err);
        res.send("Error deleting products.");
    }   
});

//Will need employee name, username, pin, and level (A= Admin/Owner, M=Manager, C=Cashier);
app.post('/add_employee', async (req, res) => {
    var data = req.body;
    //var employeeID = data['employeeID'];
    var employeeName = data['employeeName'];
    var employeeUsername = data['employeeUsername'];
    var employeePin = data['employeePin'];
    var employeeLevel = String.fromCharCode(data['employeeLevel']);


    pool.query(
        "INSERT INTO employee (employeeName, employeeUsername, employeePin, employeeLevel) VALUES ($1,$2,$3,$4)",
        [employeeName, employeeUsername, employeePin, employeeLevel]
    )
        .then(result => {
            console.log("Insert successful");
            res.send("employee added successfully!");
        })
        .catch(err => {
            console.error("Error inserting employee:", err);
            res.send(err);

        });
});
//Send a JSON object with the new employee data and update the corresponding data
app.post('/update_employee', async (req, res) => {
    var data = req.body;

    var employeeID = data['employeeID'];
    var employeeName = data['employeeName'];
    var employeeUsername = data['employeeUsername'];
    var employeePin = data['employeePin'];
    var employeeLevel = String.fromCharCode(data['employeeLevel']);

    pool.query(
        "UPDATE employee SET employeeName = $1, employeeUsername = $2, employeePin = $3, employeeLevel = $4 WHERE employeeID = $5",
        [employeeName, employeeUsername, employeePin, employeeLevel, employeeID]
    )
        .then(result => {
            console.log("Update successful");
            res.send("employee updated successfully!");
        })
        .catch(err => {
            console.error("Error updating employee:", err);
            console.log(err);
            res.send(err);

        });

})

app.get("/get_employees", async (req, res) => {

    try {
        var q = "SELECT * FROM EMPLOYEE";
        pool.query(q).then(result => {
            if (result.rows.length == 0) {
                console.log("No data");
                res.send("No Data");
            } else {
                res.json(result.rows);
            }
        });


    } catch (error) {
        console.log(error)
    }

});


function CheckIfUPC(data) {
    return data >= 1000 && data <= 9999;
}

app.post("/get_product_for_sale", async (req, res) => {

    var data = req.body;
    console.log(data);
    console.log(BigInt(data.searchMethod));
    if (CheckIfUPC(BigInt(data.searchMethod))) {
        console.log("UPC");
        pool.query("SELECT * FROM product WHERE productsku=$1", [BigInt(data.searchMethod)]).then(result => {
            if (result.rows.length == 0) {
                res.send("No Matching Products");
            } else {
                res.json(result.rows);

            }

        });

    } else {
        pool.query("SELECT * FROM product WHERE productupc=$1", [data.searchMethod]).then(result => {
            if (result.rows.length == 0) {
                res.send("No Matching Products");
            } else {
                res.json(result.rows);
            }

        });
    }






})
    ;
app.post("/search_inventory", async (req, res) => {
    var data = req.body;
    const searchElement = data.search + "%"
    try {
        pool.query("SELECT * FROM product WHERE productname LIKE $1", [searchElement]).then(result => {
            if (result.rows.length == 0) {
                res.send("No Products Found!");
            } else {
                console.log(result.rows);
                res.json(result.rows);
            }
        });
    } catch (err) {
        console.log(err);
        res.send("There has been a server error:  " + err);
    }

});

//Send a JSON object with products
app.post('/make_sale', async (req, res) => {
    const data = req.body;
    const timestamp = data.timestamp;
    const products = data.products; // array of SKUs
    const saleAmount = data.total;
    const method = data.method;
    const saleId = data.id;

    console.log(data);

    try {
        // Insert the sale
        const insertSaleQuery = `INSERT INTO sale (saleid, saledate, saleamount, paymentmethod) VALUES ($1, $2, $3, $4)`;
        const saleValues = [saleId, timestamp, saleAmount, method];
        await pool.query(insertSaleQuery, saleValues);

        // Loop through products
        for (const sku of products) {
            console.log("Processing SKU:", sku);

            // Insert sale item
            const insertSaleItemQuery = `
                INSERT INTO sale_item (saleid, itemname, productsku, itemcount)
                VALUES ($1, (SELECT productname FROM product WHERE productsku=$2), $2, $3)
            `;
            const saleItemValues = [saleId, sku, 1];
            await pool.query(insertSaleItemQuery, saleItemValues);

            // Decrement inventory safely
            const updateInventoryQuery = `
                UPDATE product
                SET inventorycount = GREATEST(inventorycount - 1, 0)
                WHERE productsku = $1
            `;
            await pool.query(updateInventoryQuery, [sku]);
            console.log("Inventory decremented for SKU:", sku);
        }

        res.send("success");

    } catch (err) {
        console.error("Error processing sale:", err);
        res.status(500).json({ success: false, error: "Failed to record sale" });
    }
});


//create the clockin in the database
app.post('/create_clockin', async (req, res) => {

    var data = req.body;
    var type = data["type"];
    console.log(req.body);


    if (type == "in") {
        try {

            var query = "INSERT INTO clock_in (sessionid, employeeid, clockedintime, clockedouttime) VALUES ($1,$2, $3, $4);";
            var values = [data.sessionId, data.userId, data.timeIn, null];

            pool.query(query, values).then(result => {
                console.log("Insert successful");
                res.send("success");
            });


        } catch (err) {
            console.log(err);
            res.send("error");
        }
    } else {
        try {

            var query = "UPDATE clock_in SET clockedouttime = $1 WHERE sessionid = $2;";
            var values = [data.timeOut, data.sessionId];
            pool.query(query, values).then(result => {
                console.log("Update successful");
            });


        } catch (err) {
            console.log(err);
        }
    }





});

//gets the entire inventory and sends it to the client
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


//gets a new sku for the client
app.get("/get_new_sku", async (req, res) => {
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

app.get("/get_sale_counter", async (req, res) => {
    console.log("Sales counter called");
    try {
        const result = await pool.query(
            "SELECT currentsale FROM SALE_COUNTER WHERE entryId = 1;"
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Sale Counter not found" });
        }

        let currentSale = result.rows[0].currentsale;
        const incrementSale = currentSale + 1;
        await pool.query(
            "UPDATE SALE_COUNTER SET currentsale = $1 WHERE entryId = 1;",
            [incrementSale]
        );
        res.send(currentSale);

        console.log("Current Sale: " << currentSale);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});
app.get("/get_sales_data", async (req, res) => {
    console.log("Sales data requested");
    try {
        const result = await pool.query("SELECT * FROM sale;");
        console.log(result.rows);
        if (result.rows.length == 0) {
            res.send("No Data in Database!");
        } else {
            res.json(result.rows);
        }
    } catch (err) {

    }




});


app.post("/login", async (req, res) => {

    console.log(req.body);
    var employeeusername = req.body.employeeusername;
    var employeepin = req.body.employeepin;

    try {

        pool.query("SELECT * FROM employee WHERE employeeusername=$1 AND employeepin=$2", [employeeusername, employeepin,]).then(result => {
            if (result.rows.length == 0) {
                res.send("Error");
            } else {
                res.send(result.rows);
            }
        });

    } catch (err) {
        console.log(err);
    }


});


//Get schedule for an employee
app.get('/get_schedule/:employeeID', async (req, res) => {
    const employeeID = req.params.employeeID;

    pool.query(
        "SELECT scheduleid, employeeid, shiftdate, starttime, endtime FROM schedule WHERE employeeid = $1 ORDER BY shiftdate, starttime",
        [employeeID]
    )
    .then(result => {
        res.json(result.rows);
    })
    .catch(err => {
        console.error("Error getting schedule:", err);
        res.status(500).send(err);
    });
});

//Add a shift to the schedule
app.post('/add_shift', async (req, res) => {
    const data = req.body;
    const employeeID = data.employeeID;
    const shiftDate = data.shiftDate;
    const startTime = data.startTime;
    const endTime = data.endTime;

    pool.query(
        "INSERT INTO schedule (employeeid, shiftdate, starttime, endtime) VALUES ($1, $2, $3, $4)",
        [employeeID, shiftDate, startTime, endTime]
    )
    .then(result => {
        res.send("Shift added successfully!");
    })
    .catch(err => {
        console.error("Error adding shift:", err);
        res.status(500).send(err);
    });
});

//Get all schedules with employee names
app.get('/get_all_schedules', async (req, res) => {
    pool.query(
        `SELECT s.scheduleid, 
                s.shiftdate, 
                s.starttime, 
                s.endtime, 
                e.employeeid, 
                e.employeename
         FROM schedule s
         JOIN employee e ON e.employeeid = s.employeeid
         ORDER BY s.shiftdate, s.starttime`,
    )
    .then(result => res.json(result.rows))
    .catch(err => {
        console.error(err);
        res.status(500).send(err);
    });
});

    //Delete a shift by id
app.get('/delete_shift/:id', async (req, res) => {
    const shiftId = req.params.id;

    pool.query("DELETE FROM schedule WHERE scheduleid = $1", [shiftId])
    .then(result => {
        res.send("Shift deleted successfully!");
    })
    .catch(err => {
        console.error("Error deleting shift:", err);
        res.send("error");
     });
    });


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});