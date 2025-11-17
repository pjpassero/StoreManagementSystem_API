CREATE DATABASE store;

CREATE TABLE PRODUCT (
    productSKU INT PRIMARY KEY,
    productName VARCHAR(255),
    productCost DECIMAL,
    productPrice DECIMAL,
    productUPC BIGINT,
    productDescription TEXT
)

CREATE TABLE EMPLOYEE (
    employeeID INT PRIMARY KEY,
    employeeName VARCHAR(255),
    employeeUsername VARCHAR(255),
    employeePin INT,
)