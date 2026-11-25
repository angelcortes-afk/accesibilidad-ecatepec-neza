// ======================================
// CONFIGURACIÓN DEL MAPA
// ======================================

const mapa = L.map("map").setView(
    [19.5500, -99.0300],
    11
);

const mapaBase = L.tileLayer(
    "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "© OpenStreetMap"
    }
);

mapaBase.addTo(mapa);


// ======================================
// CAPAS
// ======================================

const capaManzanas = L.layerGroup().addTo(mapa);
const capaMetro = L.layerGroup().addTo(mapa);
const capaMetrobus = L.layerGroup().addTo(mapa);
const capaMexibus = L.layerGroup().addTo(mapa);
const capaCobertura = L.layerGroup().addTo(mapa);
const capaSinCobertura = L.layerGroup().addTo(mapa);


// ======================================
// VARIABLES GLOBALES
// ======================================

let poblacionAnalizada = 0;
let manzanasAnalizadas = 0;

let poblacion500 = 0;
let poblacion1000 = 0;
let poblacion1500 = 0;

let poblacionSinCobertura = 0;

let viviendasSinCobertura = 0;

let manzanasEcatepec;
let manzanasNeza;


// ======================================
// FUNCIONES AUXILIARES
// ======================================

function obtenerDistancia(capaOrigen) {

    capaOrigen = capaOrigen || "";

    if (capaOrigen.includes("1500m")) {
        return "1500 m";
    }

    if (capaOrigen.includes("1000m")) {
        return "1000 m";
    }

    if (capaOrigen.includes("500m")) {
        return "500 m";
    }

    return "Fuera de cobertura";

}


function colorAccesibilidad(capaOrigen) {

    capaOrigen = capaOrigen || "";

    if (capaOrigen.includes("1500m")) {
        return "#E53935";
    }

    if (capaOrigen.includes("1000m")) {
        return "#FBC02D";
    }

    if (capaOrigen.includes("500m")) {
        return "#43A047";
    }

    return "#BDBDBD";

}


function actualizarIndicador(id, valor) {

    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor;
    }

}


function actualizarDashboard() {

    actualizarIndicador(
        "indicadorPoblacion",
        poblacionAnalizada.toLocaleString("es-MX")
    );

    actualizarIndicador(
        "indicadorManzanas",
        manzanasAnalizadas.toLocaleString("es-MX")
    );

    actualizarIndicador(
        "indicadorSinCobertura",
        poblacionSinCobertura.toLocaleString("es-MX")
    );

    actualizarIndicador(
        "indicadorViviendasSinCobertura",
        viviendasSinCobertura.toLocaleString("es-MX")
    );

    if (poblacionAnalizada > 0) {

        const cobertura = (
            (
                poblacionAnalizada -
                poblacionSinCobertura
            ) /
            poblacionAnalizada
        ) * 100;

        actualizarIndicador(
            "indicadorCobertura",
            cobertura.toFixed(1) + "%"
        );

    }

}


// ======================================
// CREAR POPUP DE MANZANA
// ======================================

function actualizarPanelInformacion(
    propiedades,
    municipio
) {

    document.getElementById(
        "infoCvegeo"
    ).textContent =
        propiedades.cvegeo || "-";

    document.getElementById(
        "infoMunicipio"
    ).textContent =
        municipio;

    document.getElementById(
        "infoPoblacion"
    ).textContent =
        propiedades.pob_tot ?? "-";

    document.getElementById(
        "infoViviendas"
    ).textContent =
        propiedades.tot_viv ?? "-";

    document.getElementById(
        "infoAccesibilidad"
    ).textContent =
        obtenerDistancia(
            propiedades.layer
        );

}


// ======================================
// CARGAR MUNICIPIO
// ======================================

function cargarMunicipio(
    archivo,
    municipio,
    esEcatepec
) {

    fetch(archivo)

        .then(respuesta => {

            if (!respuesta.ok) {

                throw new Error(
                    "No se pudo cargar " +
                    archivo
                );

            }

            return respuesta.json();

        })

        .then(datos => {

            const manzanasUnicas =
                new Set();

            datos.features.forEach(
                function(feature) {

                    const p =
                        feature.properties || {};

                    const capaOrigen =
                        p.layer || "";

                    const poblacion =
                        Number(
                            p.pob_tot
                        ) || 0;

                    const cvegeo =
                        p.cvegeo;

                    if (
                        capaOrigen.includes(
                            "1500m"
                        )
                    ) {

                        poblacion1500 +=
                            poblacion;

                    }

                    else if (
                        capaOrigen.includes(
                            "1000m"
                        )
                    ) {

                        poblacion1000 +=
                            poblacion;

                    }

                    else if (
                        capaOrigen.includes(
                            "500m"
                        )
                    ) {

                        poblacion500 +=
                            poblacion;

                    }

                    if (
                        cvegeo &&
                        !manzanasUnicas.has(
                            cvegeo
                        )
                    ) {

                        manzanasUnicas.add(
                            cvegeo
                        );

                        poblacionAnalizada +=
                            poblacion;

                    }

                }
            );

            manzanasAnalizadas +=
                manzanasUnicas.size;

            const capa = L.geoJSON(
                datos,
                {

                    style: function(
                        feature
                    ) {

                        const p =
                            feature.properties || {};

                        return {

                            color:
                                "#666666",

                            weight: 0.4,

                            fillColor:
                                colorAccesibilidad(
                                    p.layer
                                ),

                            fillOpacity: 0.60

                        };

                    },

                    onEachFeature:
                        function(
                            feature,
                            layer
                        ) {

                            layer.on(
                                "click",
                                function() {

                                    actualizarPanelInformacion(
                                        feature.properties || {},
                                        municipio
                                    );

                                }
                            );

                        }

                }
            );

            if (esEcatepec) {

                manzanasEcatepec =
                    capa;

            } else {

                manzanasNeza =
                    capa;

            }

            capa.addTo(
                capaManzanas
            );

            actualizarDashboard();

            console.log(
                municipio +
                " cargado correctamente"
            );

        })

        .catch(error => {

            console.error(error);

        });

}


// ======================================
// CARGAR MUNICIPIOS
// ======================================

cargarMunicipio(
    "ecatepec_concobertura.geojson",
    "Ecatepec de Morelos",
    true
);

cargarMunicipio(
    "neza_concobertura.geojson",
    "Nezahualcóyotl",
    false
);


// ======================================
// CARGAR SIN COBERTURA
// ======================================

function cargarSinCobertura(
    archivo,
    municipio
) {

    fetch(archivo)

        .then(
            respuesta =>
                respuesta.json()
        )

        .then(datos => {

            datos.features.forEach(
                function(feature) {

                    poblacionSinCobertura +=
                        Number(
                            feature.properties
                                .pob_tot
                        ) || 0;

                    viviendasSinCobertura +=
                        Number(
                            feature.properties
                                .tot_viv
                        ) || 0;
                }
            );

            actualizarDashboard();

            const capa =
                L.geoJSON(
                    datos,
                    {

                        style:
                            function() {

                                return {

                                    color:
                                        "#4A148C",

                                    weight: 0.8,

                                    fillColor:
                                        "#6A1B9A",

                                    fillOpacity:
                                        0.80

                                };

                            },

                        onEachFeature:
                            function(
                                feature,
                                layer
                            ) {

                                const p =
                                    feature.properties || {};

                                layer.bindPopup(

                                    "<b>Sin cobertura</b>" +
                                    "<hr>" +
                                    "<b>Municipio:</b> " +
                                    municipio +
                                    "<br><b>Población:</b> " +
                                    (p.pob_tot || "-") +
                                    "<br><b>Viviendas:</b> " +
                                    (p.tot_viv || "-")

                                );

                            }

                    }
                );

            capa.addTo(
                capaSinCobertura
            );

        });

}


cargarSinCobertura(
    "inegi_mexico_ecatepec_mzn_2020_transporte_sincobertura.geojson",
    "Ecatepec de Morelos"
);

cargarSinCobertura(
    "inegi_mexico_neza_mzn_2020_transporte_sincobertura.geojson",
    "Nezahualcóyotl"
);

// ======================================
// MULTIRINGS DE COBERTURA
// ======================================

function colorMultiring(distancia) {

    distancia = String(distancia);

    if (distancia === "500") {
        return "#43A047";
    }

    if (distancia === "1000") {
        return "#FBC02D";
    }

    if (distancia === "1500") {
        return "#E53935";
    }

    return "#999999";

}


function cargarMultiring(
    archivo
) {

    fetch(archivo)

        .then(
            respuesta =>
                respuesta.json()
        )

        .then(datos => {

            const multiring =
                L.geoJSON(
                    datos,
                    {

                        style: function(
                            feature
                        ) {

                            const distancia =
                                feature
                                .properties
                                .mrb_dist;

                            return {

                                color:
                                    colorMultiring(
                                        distancia
                                    ),

                                fillColor:
                                    colorMultiring(
                                        distancia
                                    ),

                                weight: 1,

                                fillOpacity: 0.08

                            };

                        },

                        onEachFeature:
                            function(
                                feature,
                                layer
                            ) {

                                layer.bindPopup(

                                    "<b>Área de influencia</b>" +
                                    "<hr>" +
                                    "<b>Distancia:</b> " +
                                    feature.properties.mrb_dist +
                                    " m"

                                );

                            }

                    }
                );

            multiring.addTo(
                capaCobertura
            );

        });

}

cargarMultiring(
    "datosgob_cdmx_estaciones_metro_2026_multiringbuffer.geojson"
);

cargarMultiring(
    "datosgob_cdmx_estaciones_metrobus_2025_multiringbuffer.geojson"
);

cargarMultiring(
    "angel_mexico_estaciones_mexibus_2026_multiringbuffer.geojson"
);

// ======================================
// COLORES DEL MEXIBÚS
// ======================================

function colorMexibus(linea) {

    const colores = {

        "L1": "#3F7D4A",
        "L1A": "#30633A",
        "L2": "#E31A1C",
        "L2A": "#D7191C",
        "L3": "#27A9CF",
        "L4": "#E5B321"

    };

    return colores[linea] || "#777777";

}


// ======================================
// COLORES DEL METRO
// ======================================

function colorMetro(linea) {

    linea = String(linea);

    if (linea === "01") linea = "1";
    if (linea === "02") linea = "2";
    if (linea === "03") linea = "3";
    if (linea === "04") linea = "4";
    if (linea === "05") linea = "5";
    if (linea === "06") linea = "6";
    if (linea === "07") linea = "7";
    if (linea === "08") linea = "8";
    if (linea === "09") linea = "9";

    const colores = {

        "1": "#f112d4",
        "2": "#1565C0",
        "3": "#a0c047",
        "4": "#38c5d8",
        "5": "#FFEB3B",
        "6": "#E91E63",
        "7": "#FF9800",
        "8": "#4CAF50",
        "9": "#795548",
        "A": "#9C27B0",
        "B": "#9E9E9E",
        "10": "#1E88E5",
        "11": "#8E24AA",
        "12": "#C5A100"

    };

    return colores[linea] || "#444444";

}


// ======================================
// COLORES DEL METROBÚS
// ======================================

function colorMetrobus(linea) {

    linea = String(linea);

    const colores = {

        "01": "#A52A2A",
        "02": "#8E24AA",
        "03": "#689F38",
        "04": "#FF9800",
        "05": "#1565C0",
        "06": "#E53935",
        "07": "#00897B"

    };

    return colores[linea] || "#555555";

}


function obtenerLineaMetrobus(feature) {

    return (
        feature.properties.linea ||
        feature.properties.lineas ||
        ""
    );

}


// ======================================
// CARGADOR GENERAL DE LÍNEAS
// ======================================

function cargarLineas(
    archivo,
    capaDestino,
    funcionColor,
    obtenerColor
) {

    fetch(archivo)

        .then(
            respuesta =>
                respuesta.json()
        )

        .then(datos => {

            const capa = L.geoJSON(
                datos,
                {

                    style: function(feature) {

                        return {

                            color: funcionColor(
                                obtenerColor(feature)
                            ),

                            weight: 5,

                            opacity: 1

                        };

                    }

                }
            );

            capa.addTo(
                capaDestino
            );

        });

}


// ======================================
// CARGADOR GENERAL DE ESTACIONES
// ======================================

function cargarEstaciones(
    archivo,
    capaDestino,
    funcionColor,
    obtenerColor,
    popupBuilder,
    radio = 6
) {

    fetch(archivo)

        .then(
            respuesta =>
                respuesta.json()
        )

        .then(datos => {

            const capa = L.geoJSON(
                datos,
                {

                    pointToLayer:
                        function(
                            feature,
                            latlng
                        ) {

                            return L.circleMarker(
                                latlng,
                                {

                                    radius:
                                        radio,

                                    fillColor:
                                        funcionColor(
                                            obtenerColor(
                                                feature
                                            )
                                        ),

                                    color:
                                        "#FFFFFF",

                                    weight: 2,

                                    opacity: 1,

                                    fillOpacity: 1

                                }
                            );

                        },

                    onEachFeature:
                        function(
                            feature,
                            layer
                        ) {

                            layer.bindPopup(
                                popupBuilder(
                                    feature.properties || {}
                                )
                            );

                        }

                }
            );

            capa.addTo(
                capaDestino
            );

        });

}
cargarLineas(
    "angel_mexico_lineas_mexibus_2026.geojson",
    capaMexibus,
    colorMexibus,
    feature => feature.properties.linea
);

cargarEstaciones(
    "angel_mexico_estaciones_mexibus_2026.geojson",
    capaMexibus,
    colorMexibus,
    feature => feature.properties.linea,

    p =>

        "<b>" + (p.sistema || "Mexibús") + "</b>" +
        "<hr>" +
        "<b>Estación:</b> " + (p.nombre || "-") +
        "<br><b>Línea:</b> " + (p.linea || "-") +
        "<br><b>Tipo:</b> " + (p.tipo || "-") +
        "<br><b>Servicio:</b> " + (p.servicio || "-") +
        "<br><b>Municipio:</b> " + (p.municipio || "-")
);
cargarLineas(
    "datosgob_cdmx_lineas_metro_2025.geojson",
    capaMetro,
    colorMetro,
    feature => feature.properties.linea
);

cargarEstaciones(
    "datosgob_cdmx_estaciones_metro_2026.geojson",
    capaMetro,
    colorMetro,
    feature => feature.properties.linea,

    p =>

        "<b>" + (p.sistema || "STC Metro") + "</b>" +
        "<hr>" +
        "<b>Estación:</b> " + (p.nombre || "-") +
        "<br><b>Línea:</b> " + (p.linea || "-") +
        "<br><b>Tipo:</b> " + (p.tipo || "-") +
        "<br><b>Municipio / Alcaldía:</b> " +
        (p.municipio || p.alcaldias || "-"),

    5
);
cargarLineas(
    "datosgob_cdmx_lineas_metrobus_2025.geojson",
    capaMetrobus,
    colorMetrobus,
    obtenerLineaMetrobus
);

cargarEstaciones(
    "datosgob_cdmx_estaciones_metrobus_2025.geojson",
    capaMetrobus,
    colorMetrobus,

    feature =>
        feature.properties.linea ||
        feature.properties.lineas ||

        "",

    p => {

        const linea =
            p.linea ||
            p.lineas ||
            "-";

        return (

            "<b>" + (p.sistema || "Metrobús") + "</b>" +
            "<hr>" +
            "<b>Estación:</b> " + (p.nombre || "-") +
            "<br><b>Línea:</b> " + linea +
            "<br><b>Tipo:</b> " + (p.tipo || "-") +
            "<br><b>Alcaldía:</b> " +
            (p.alcaldias || "-")

        );

    }
);
// ======================================
// CONTROL GENERAL DE CAPAS
// ======================================

function controlarCapa(checkbox, capa) {

    if (checkbox.checked) {

        mapa.addLayer(capa);

    }

    else {

        mapa.removeLayer(capa);

    }

}


// ======================================
// EVENTOS DE CHECKBOXES
// ======================================

const controlesCapas = [

    {
        id: "capaManzanas",
        capa: capaManzanas
    },

    {
        id: "capaMetro",
        capa: capaMetro
    },

    {
        id: "capaMetrobus",
        capa: capaMetrobus
    },

    {
        id: "capaMexibus",
        capa: capaMexibus
    },

    {
        id: "capaCobertura",
        capa: capaCobertura
    },

    {
        id: "capaSinCobertura",
        capa: capaSinCobertura
    }

];

controlesCapas.forEach(function(item){

    const elemento =
        document.getElementById(
            item.id
        );

    if (!elemento) return;

    elemento.addEventListener(
        "change",
        function() {

            controlarCapa(
                this,
                item.capa
            );

        }
    );

});


// ======================================
// CAMBIAR MUNICIPIO
// ======================================

function mostrarMunicipio(
    municipio
) {

    capaManzanas.clearLayers();

    if (
        municipio === "ecatepec"
    ) {

        if (manzanasEcatepec) {

            capaManzanas.addLayer(
                manzanasEcatepec
            );

        }

        mapa.setView(
            [19.6018, -99.0507],
            12
        );

    }

    else if (
        municipio === "neza"
    ) {

        if (manzanasNeza) {

            capaManzanas.addLayer(
                manzanasNeza
            );

        }

        mapa.setView(
            [19.4006, -99.0148],
            13
        );

    }

    else {

        if (manzanasEcatepec) {

            capaManzanas.addLayer(
                manzanasEcatepec
            );

        }

        if (manzanasNeza) {

            capaManzanas.addLayer(
                manzanasNeza
            );

        }

        mapa.setView(
            [19.5000, -99.0300],
            11
        );

    }

}


// ======================================
// SELECTOR DE MUNICIPIO
// ======================================

document
    .getElementById("municipio")
    .addEventListener(
        "change",
        function() {

            mostrarMunicipio(
                this.value
            );

        }
    );


// ======================================
// MENSAJE DE INICIO
// ======================================

console.log(
    "SIG Web cargado correctamente"
);

console.log(
    "Proyecto de accesibilidad al transporte listo."
);