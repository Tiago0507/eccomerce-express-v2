const multer = require('multer');
const path = require('path');
const { users, products } = require('../dataStore');

// Set up multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Create multer instance
const upload = multer({ storage: storage });

exports.upload = upload;

/**
 * Adds a new product to the product list.
 * 
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {object} - The response containing the added product.
 */
exports.addProduct = async (req, res) => {
    try {
        // Fetch user information based on the provided token
        const whoamiResponse = await fetch('http://localhost:3000/whoami', {
            method: 'GET',
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        // Handle unauthorized or invalid token
        if (whoamiResponse.status !== 200) {
            return res.status(401).send('Token inválido o usuario no autenticado');
        }

        // Extract user data from the response
        const userData = await whoamiResponse.json();
        const user = users.get(userData.token);

        // Check if the user is an admin
        if (!user.isAdmin()) {
            return res.status(403).send('No tiene permisos para agregar productos');
        }

        // Extract product details from the request body
        const { name, description, price, quantity } = req.body;
        const image = req.file;

        // Validate required fields
        if (!name || !description || !price || !quantity || !image) {
            return res.status(400).send('Todos los campos son obligatorios');
        }

        // Generate a unique ID for the new product
        const newProductId = products.size + 1;

        // Create the new product object
        const newProduct = {
            id: newProductId,
            name,
            description,
            price,
            quantity,
            imageUrl: `src/uploads/${image.filename}`
        };

        // Add the new product to the product list
        products.set(newProductId, newProduct);

        // Send the response with the added product
        res.status(201).send(newProduct);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error interno del servidor');
    }
};


const fs = require('fs');

/**
 * Retrieves all products from the product list.
 * 
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {object} - The response containing the list of products.
 */
exports.getProducts = (req, res) => {
    // Convert products map to an array
    const productsArray = Array.from(products.values()).map(product => {
        const imageBuffer = fs.readFileSync(product.imageUrl);
        const imageBase64 = imageBuffer.toString('base64');
    
        const productWithoutImageLink = { ...product };
        delete productWithoutImageLink.imageLink;
    
        return {
            ...productWithoutImageLink,
            image: imageBase64
        };
    });
    
    // Send as response
    res.send(productsArray);
};



/**
 * Deletes a product from the product list.
 * 
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {object} - The response confirming the deletion of the product.
 */
exports.deleteProduct = async (req, res) => {
    try {
        // Fetch user information based on the provided token
        const whoamiResponse = await fetch('http://localhost:3000/whoami', {
            method: 'GET',
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        // Handle unauthorized or invalid token
        if (whoamiResponse.status !== 200) {
            return res.status(401).send('Token inválido o usuario no autenticado');
        }

        // Extract user data from the response
        const userData = await whoamiResponse.json();
        const user = users.get(userData.token);

        // Check if the user is an admin
        if (!user.isAdmin()) {
            return res.status(403).send('No tiene permisos para eliminar productos');
        }

        // Extract the product ID from the request body
        const productId = req.body.productId;

        // Validate the product ID
        if (!productId) {
            return res.status(400).send('ID de producto no válido');
        }

        // Retrieve the product from the product list
        const product = products.get(productId);

        // Check if the product exists
        if (!product) {
            return res.status(404).send('Producto no encontrado');
        }

        // Delete the product from the product list
        products.delete(productId);

        // Send the response confirming the deletion of the product
        return res.status(200).send('Producto eliminado correctamente');
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Error interno del servidor');
    }
};



/**
 * Retrieves a single product from the product list by its ID.
 * 
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {object} - The response containing the product.
 */
exports.getProductById = (req, res) => {
    // Extract product ID from the request parameters
    const productId = parseInt(req.params.id);

    // Validate the product ID
    if (isNaN(productId)) {
        return res.status(400).send('ID de producto no válido');
    }

    // Retrieve the product from the product list
    const product = products.get(productId);

    // Check if the product exists
    if (!product) {
        return res.status(404).send('Producto no encontrado');
    }

    // Read the image file
    const fs = require('fs');
    const imageBuffer = fs.readFileSync(product.imageUrl);
    const imageBase64 = imageBuffer.toString('base64');

    // Return the product with the image in base64 format
    const productWithImage = {
        ...product,
        image: imageBase64
    };

    // Send the response with the product
    res.status(200).send(productWithImage);
};



/**
 * Updates a product in the product list.
 * 
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {object} - The response containing the updated product.
 */
exports.updateProduct = async (req, res) => {
    try {
        // Fetch user information based on the provided token
        const whoamiResponse = await fetch('http://localhost:3000/whoami', {
            method: 'GET',
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        // Handle unauthorized or invalid token
        if (whoamiResponse.status !== 200) {
            return res.status(401).send('Token inválido o usuario no autenticado');
        }

        // Extract user data from the response
        const userData = await whoamiResponse.json();
        const user = users.get(userData.token);

        // Check if the user is an admin
        if (!user.isAdmin()) {
            return res.status(403).send('No tiene permisos para actualizar productos');
        }

        // Extract product ID from the request parameters
        const productId = req.body.productId;

        // Retrieve the product from the product list
        const product = products.get(Number(productId));

        // Check if the product exists
        if (!product) {
            return res.status(404).send('Producto no encontrado');
        }

        // Update product fields if provided in the request body
        if (req.body.name) {
            product.name = req.body.name;
        }
        if (req.body.description) {
            product.description = req.body.description;
        }
        if (req.body.price) {
            product.price = req.body.price;
        }
        if (req.body.quantity) {
            product.quantity = req.body.quantity;
        }
        if (req.file) {
            // Update image if provided
            const imagePath = `src/uploads/${req.file.filename}`;
            fs.unlinkSync(product.imageUrl); // Delete the previous image
            product.imageUrl = imagePath;
        }

        // Send the response with the updated product
        return res.status(200).send(product);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Error interno del servidor');
    }
};

