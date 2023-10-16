const download = require("image-downloader");
const { v4: uuidv4 } = require("uuid");

const {
    getImageMetadata,
    insertImageCommercialMetadata,
    insertImageEditorialMetadata,
} = require("../models/shutterstock.model");

const importCsv = async (stream) => {
    return new Promise((resolve, reject) => {
        let listOfIds = [];

        stream.on("data", (row) => {
            listOfIds.push({
                shutterstock_id: row.id,
            });
        });
        stream.on("end", () => resolve(listOfIds));
    });
};

const factoryShutterstock = (credentials) => {
    const headers = {
        "Content-type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${credentials}`,
    };

    const getImageDataWithCredentials = async (imageId, licenseType) => {
        try {
            if (licenseType === "Commercial") {
                const getImageData = await fetch(
                    `${process.env.API_URL_SANDBOX}images/${imageId}`,
                    {
                        headers,
                    }
                );
                return await getImageData.json();
            } else {
                const params = new URLSearchParams();
                params.append("country", "USA");
                const getImageData = await fetch(
                    `${process.env.API_URL_BASE
                    }editorial/images/${imageId}?${params.toString()}`,
                    {
                        headers,
                    }
                );
                return await getImageData.json();
            }
        } catch (error) {
            console.error(error.message);
            //return null;
        }
    };

    const licenseImage = async (imageId, licenseType) => {
        try {
            if (licenseType === "Commercial") {
                const bodyData = {
                    images: [
                        {
                            image_id: imageId,
                            subscription_id: process.env.SUBSCRIPTION_ID,
                            price: 0,
                            metadata: {
                                customer_id: "",
                            },
                        },
                    ],
                };
                const body = JSON.stringify(bodyData);
                const licenseOfimage = await fetch(
                    `${process.env.API_URL_SANDBOX}images/licenses`,
                    {
                        headers,
                        method: "POST",
                        body,
                    }
                );

                return await licenseOfimage.json();
            } else {
                let licenseOfimage;
                const order_idRandom = uuidv4();
                if (credentials === process.env.SHUTTERSTOCK_EDITORIAL_TOKEN) {
                    const bodyData = {
                        editorial: [
                            {
                                editorial_id: imageId,
                                license: "premier_editorial_all_media",
                                metadata: {
                                    order_id: order_idRandom,
                                },
                            },
                        ],
                        country: "USA",
                    };
                    const body = JSON.stringify(bodyData);
                    licenseOfimage = await fetch(
                        `${process.env.API_URL_BASE}editorial/images/licenses`,
                        {
                            headers,
                            method: "POST",
                            body,
                        }
                    );
                } else {
                    const bodyData = {
                        editorial: [
                            {
                                editorial_id: imageId,
                                license: "premier_editorial_comp",
                                metadata: {
                                    order_id: order_idRandom,
                                },
                            },
                        ],
                        country: "USA",
                    };
                    const body = JSON.stringify(bodyData);
                    licenseOfimage = await fetch(
                        `${process.env.API_URL_BASE}editorial/images/licenses`,
                        {
                            headers,
                            method: "POST",
                            body,
                        }
                    );
                }

                return await licenseOfimage.json();
            }
        } catch (error) {
            console.error(error.message);
            return null;
        }
    };

    return {
        getImageDataWithCredentials,
        licenseImage,
    };
};

const insertDB = async (imageMetadata, licenseType) => {
    try {
        if (imageMetadata !== null) {
            const [result] = await getImageMetadata(imageMetadata.shutterstock_id);
            if (!result[0]) {
                if (licenseType === "Commercial") {
                    const [data] = await insertImageCommercialMetadata(imageMetadata);
                } else {
                    const [data] = await insertImageEditorialMetadata(imageMetadata);
                }
                return `El registro con ID: ${imageMetadata.shutterstock_id} se guardo satisfactoriamente en la BD`;
            }
            return `El registro con ID: ${imageMetadata.shutterstock_id} ya existe en la BD`;
        }

    } catch (error) {
        if (error.code && error.code === 'ER_DUP_ENTRY') {
            return "Entrada de archivo duplicada, el archivo ya existe en la BD"
        } else {
            return `Error al procesar el archivo con ID: ${imageMetadata.shutterstock_id}`;
        }
    }
};

const saveImages = async (imageUrl) => {
    const imageId = getImageIdFromUrl(imageUrl.url);
    const options = {
        url: imageUrl.url,
        dest: `C:/Users/yborg/OneDrive/Documents/Proyectos activos/Dashboard D2America/Troubleshooting_bknd/download/${imageId}.jpg`,
    };
    try {
        const { filename } = await download.image(options);
        return `Saved to ${filename}`;
        //console.log("Saved to", filename);
    } catch (err) {
        console.error(err);
    }
};

const getImageIdFromUrl = (imageUrl) => {
    const parts = imageUrl.split('/');
    let name = parts[parts.length - 1].split('.')[0];

    if (!name.startsWith("shutterstock_")) {
        return `shutterstock_${name}`;
    }
    return name;
};


module.exports = {
    getImageIdFromUrl,
    importCsv,
    factoryShutterstock,
    insertDB,
    saveImages
}