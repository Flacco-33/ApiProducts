//Paso 1 Importar Express
const express = require("express");
const {PrismaClient} = require("@prisma/client")

const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const path = require('path')

const prisma = new PrismaClient()

const storage = multer.diskStorage({
  destination : './images',
  filename:(req,file,cb)=>{
    const nombre = `${Date.now()} - ${Math.round(Math.round()*1000)}`;
    const ext=path.extname(file.originalname);
    cb(null,`${file.fieldname}-${nombre}${ext}`);
  }
})
//Paso 2 Definir el servidor
const app = express();
app.use(express.json());
//Paso3 Definir Puerto
app.listen(3000);

console.log("Servidor activo");

const upoad = multer({storage});
          
cloudinary.config({ 
  cloud_name: 'da7vlqvco', 
  api_key: '135949247446237', 
  api_secret: 'rfwm32efz3iXtDjQZV9EVKJo4fc' 
});

// Middleware para validar campos no nulos
const validateProduct = (req, res, next) => {
  const { name, stock, price } = req.body;
  if (!name || !price || !stock) {
    return res.status(400).json({ mensaje: "Todos los campos son requeridos." });
  }
  next();
};

// Middleware para validar existencia de producto por ID
const validateProductExistence = async (req, res, next) => {
  const { id } = req.params;
  try {
    const producto = await prisma.Product.findFirst({ where: { id: Number(id) } });
    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado." });
    }
    next();
  } catch (error) {
    console.error("Error al obtener el producto:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// Obtener todos los productos
app.get("/productos", async (req, res) => {
  const productos = await prisma.Product.findMany();
  res.json(productos);
});

// Obtener un producto por ID
app.get("/productos/:id", validateProductExistence, async (req, res) => {
  const { id } = req.params;
  try {
    const producto = await prisma.Product.findUnique({ where: { id: Number(id) } });
    res.json(producto);
  } catch (error) {
    console.error("Error al obtener el producto:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
});

// Crear un nuevo producto
app.post("/productos" ,validateProduct, async (req, res) => {
  const { name, stock, price, url} = req.body;
  try {
    const nuevoProducto =  prisma.Product.create({
      data: { name, stock, price,url },
    });
    res.json(nuevoProducto);
  } catch (error) {
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      return res.status(400).json({ mensaje: "Ya existe un producto con este nombre." });
    }
    console.error("Error al crear el producto:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
  //res.send("Finalizaod")
  
});


// Actualizar un producto por ID
app.put("/productos/:id", validateProduct, validateProductExistence, async (req, res) => {
  const { id } = req.params;
  const { name, stock,price } = req.body;
  const productoActualizado = await prisma.Product.update({
    where: { id: Number(id) },
    data: { name, stock, price },
  });
  res.json(productoActualizado);
});

// Eliminar un producto por ID
app.delete("/productos/:id", validateProductExistence, async (req, res) => {
  const { id } = req.params;
  await prisma.Product.delete({ where: { id: Number(id) } });
  res.json({ mensaje: "Producto eliminado correctamente." });
});

// Agregar o eliminar un producto favorito para un usuario
app.post("/favorites/toggle", async (req, res) => {
  const { userId, productId } = req.body;

  // Verificar si el usuario y el producto existen
  const userExists = await prisma.User.findUnique({ where: { id: userId } });
  const productExists = await prisma.Product.findUnique({ where: { id: productId } });

  if (!userExists || !productExists) {
    return res.status(400).json({ mensaje: "Usuario o producto no encontrado." });
  }

  try {
    // Intentar encontrar el favorito existente
    const existingFavorite = await prisma.Favorite.findUnique({
      where: { productId_userId: { productId: Number(productId), userId: Number(userId) } }
    });

    if (existingFavorite) {
      // Si el favorito ya existe, eliminarlo
      await prisma.Favorite.delete({
        where: { productId_userId: { productId: Number(productId), userId: Number(userId) } }
      });
      res.json({ mensaje: "Producto eliminado de favoritos." });
    } else {
      // Si no existe, crearlo
      const newFavorite = await prisma.Favorite.create({
        data: { userId, productId }
      });
      res.json({ mensaje: "Producto añadido a favoritos.", favorite: newFavorite });
    }
  } catch (error) {
    console.error("Error al modificar los favoritos:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
});


// Registro
app.post('/users/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
  }

  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ mensaje: 'El correo ya está en uso' });
  }

  // Crear el usuario
  const user = await prisma.user.create({
    data: { name, email, password }, // Cifrar contraseñas en un entorno real
  });
  res.status(201).json({ mensaje: 'Usuario registrado exitosamente', user });
});

// Login
app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
  }

  // Verificar si el usuario existe
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.password !== password) {
    return res.status(401).json({ mensaje: 'Credenciales inválidas' });
  }

  // Iniciar sesión exitosamente
  res.json({ mensaje: 'Inicio de sesión exitoso', user });
});

app.post('/images',upoad.single('foto'),(req,res)=>{
  let path=req.file.destination+'/'+req.file.filename;
  let url;
  cloudinary.uploader.upload(
    path,
    {public_id:'prueba_foto'},
    (error,result)=>{
      console.log(result.url)
      res.send(result.url)
    }
  );
  //res.send("Finalizaod")
})

app.use((req, res)=>{
    res.status(404).send("not found")
});