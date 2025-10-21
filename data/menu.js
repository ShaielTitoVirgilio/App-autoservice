
let menuData = {
    categorias: [
        { id: 'hamburguesas', nombre: 'Hamburguesas', icono: '🍔' },
        { id: 'chivitos', nombre: 'Chivitos', icono: '🥪' },
        { id: 'panchos', nombre: 'Panchos', icono: '🌭' },
        { id: 'papas', nombre: 'Papas Fritas', icono: '🍟' },
        { id: 'nuggets', nombre: 'Nuggets', icono: '🍗' },
        { id: 'sandwiches', nombre: 'Sandwiches', icono: '🥪' }, 
        { id: 'chorizos', nombre: 'Chorizos', icono: '🍖' }, 
        { id: 'bebidas', nombre: 'Bebidas', icono: '🥤' },
    ],
    productos: {
        hamburguesas: [
            { id: 'hamb1', nombre: "Hamburguesa Mixta con Tomate y Lechuga", desc:"Hamburguesa hamby (85g) con tomate y lechuga", precio: 139, img:"assets/images/logo.png", personalizaciones: []},
            { id: 'hamb2', nombre: "Hamburguesa Con Jamón y Queso", desc:"Hamburguesa hamby (85g) con jamon y queso", precio: 148, img: "assets/images/jamonYqueso.png", personalizaciones: [] },
            { id: 'hamb3', nombre: "Hamburguesa Completa", desc:"Hamburguesa hamby (85g) con jamon y queso + verduras a elección", precio: 175, img: "assets/images/hamburguesa3.png", personalizaciones: []},
            { id: 'hamb4', nombre: "Hamburguesa Con Queso Colby y Panceta", desc:"Hamburguesa hamby (85g) con queso colby y panceta", precio: 165, img: "assets/images/hamburguesa3.png", personalizaciones: [] },
            { id: 'hamb5', nombre: "Hamburguesa Gigante del Paseo", desc:"Hamburguesa hamby (85g) con queso colby y panceta", precio: 230, img: "assets/images/gigante.png", personalizaciones: [] },
            { id: 'hamb6', nombre: "Hamburguesa de Pollo completa", desc:"Hamburguesa sadinesa de pollo con jamon y queso + verduras a elección", precio: 175, img: "assets/images/hamburguesa3.png", personalizaciones: [] },
            { id: 'hamb7', nombre: "Hamburguesa de Pollo XL Crocante", desc:"Pechuga de pollo con queso colby, panceta y huevo frito + verduras a elección", precio: 228, img: "assets/images/xlPollo.png", personalizaciones: [] },
            { id: 'hamb8', nombre: "Hamburguesa Doble XL Carne", desc:"Doble hamburguesa hamby con queso colby, panceta y huevo frito + verduras a elección", precio: 250, img: "assets/images/xlCarne.png", personalizaciones: [] },
            { id: 'hamb9', nombre: "Cajita Sorpresa", desc:"Hamburguesa, juguete papas", precio: 175, img: "assets/images/cajita.png", personalizaciones: [] }
        ],
        chivitos: [
            {id: 'chiv1', nombre: "Chivito Especial del Paseo", desc:"Churrasco de lomo con queso muzza, panceta, huevo frito, lechuga, tomate y cebolla ", precio: 365,img: "assets/images/chivitoSimple.png", personalizaciones: []},
            {id: 'chiv2', nombre: "Chivito Completo del Paseo con Papas Fritas", desc:"Churrasco de lomo con jamon, queso muzza, panceta, huevo frito, + verduras a elección y papas fritas ", precio: 465,img: "assets/images/chivitoEspecial.png", personalizaciones: []},
        ],
        panchos: [
            { id: 'pancho1', nombre: "Pancho con Salsas", desc:"Panchos Calidad Shneck", precio: 95, img: "assets/images/panchoComun.png", personalizaciones: [] },
            { id: 'pancho2', nombre: "Pancho con Papitas", desc:"Panchos Calidad Shneck",precio: 120, img: "assets/images/papas1.png", personalizaciones: [] },
            { id: 'pancho3', nombre: "Pancho con Muzzarella", desc:"Panchos Calidad Shneck",precio: 135, img: "assets/images/panchoMuzza.png", personalizaciones: [] },
            { id: 'pancho4', nombre: "Pancho con Panceta", desc:"Panchos Calidad Shneck",precio: 150, img: "assets/images/panchoPanz.png", personalizaciones: [] },
            { id: 'pancho5', nombre: "Pancho con Muzzarella y Panceta", desc:"Panchos Calidad Shneck",precio: 178, img: "assets/images/papas1.png", personalizaciones: [] },
        ],
        papas: [
            { id: 'papas1', nombre: "Papas Fritas Pequeñas", desc:"Calidad Mcein", precio: 65, img: "assets/images/papas1.png", personalizaciones: [] },
            { id: 'papas2', nombre: "Papas Fritas Medianas", desc:"Calidad Mcein", precio: 115, img: "assets/images/papas2.png", personalizaciones: [] },
            { id: 'papas3', nombre: "Papas Fritas Grandes", desc:"Calidad Mcein", precio: 195, img: "assets/images/papasBandeja.png", personalizaciones: [] },
        ],
        nuggets: [
            {id: 'nug1', nombre: "Nuggets De Pollo x7 Unidades", desc:"Calidad Sadia", precio:150, img:"assets/images/producto_placeholder.png", personalizaciones: []}
        ],
        sandwiches:[
            {id: 'sand1', nombre: "Calientes", desc:"Descripción Sándwich Caliente", precio:195, img:"assets/images/producto_placeholder.png", personalizaciones: []},
            {id: 'sand2', nombre: "Calientes con Muzzarella", desc:"Descripción Sándwich Caliente con Muzzarella", precio:240, img:"assets/images/sandwichMuzza.png", personalizaciones: []}
        ],
        chorizos:[
            {id: 'chorizo1', nombre: "Chorizo con Tomate y Lechuga", desc:"Chorizo extra Centenario (cerdo)", precio:145, img:"assets/images/producto_placeholder.png", personalizaciones: []},
            {id: 'chorizo2', nombre: "Chorizo Completo", desc:"Chorizo extra Centenario (cerdo) con verduras a elección", precio:240, img:"assets/images/producto_placeholder.png", personalizaciones: []}
        ],
        bebidas: [
            { id: 'beb1', nombre: "Refresco Cola 600ml", desc:"Botella", precio: 70, img:"assets/images/producto_placeholder.png", personalizaciones: [] },
            { id: 'beb2', nombre: "Agua Mineral 500ml", desc:"Botella", precio: 50, img:"assets/images/producto_placeholder.png", personalizaciones: [] },
            { id: 'beb3', nombre: "Cerveza negra patricia 473ml", desc:"Lata", precio: 50, img:"assets/images/negraLata.png", personalizaciones: [] },
            { id: 'beb4', nombre: "Cerveza rubia patricia 1l", desc:"Botella", precio: 50, img:"assets/images/patriciaLitro.png", personalizaciones: [] },
        ]
    }
};
