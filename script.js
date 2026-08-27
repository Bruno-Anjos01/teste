/*
    ============================================
    ACESSO+
    Sistema de mapa de acessibilidade
    ============================================

    IMPORTANTE:

    1. Crie uma API Key no Google Cloud.
    2. Ative:
       - Maps JavaScript API
       - Places API

    3. Coloque a chave no index.html:

       SUA_CHAVE_GOOGLE_MAPS

    4. Restrinja a API Key por domínio quando
       publicar o projeto.

    O Google Maps possui dados próprios sobre
    algumas características de acessibilidade
    física. Os demais critérios abaixo podem
    vir de um banco de dados próprio do Acesso+.
*/


// ============================================
// BANCO DE DADOS DEMONSTRATIVO
// ============================================

const places = [

    {
        id: 1,

        name: "Restaurante Vida Leve",

        type: "Restaurante",

        address: "Av. Paulista, 1000",

        distance: "0,4 km",

        position: {
            lat: -23.5632,
            lng: -46.6541
        },

        score: 98,

        accessibility: {
            wheelchair: true,
            visual: true,
            hearing: true,
            autism: true,
            elderly: true
        },

        features: [
            "Rampa de acesso",
            "Banheiro acessível",
            "Atendimento em Libras",
            "Cardápio em áudio",
            "Ambiente tranquilo",
            "Mesas acessíveis"
        ]
    },


    {
        id: 2,

        name: "Shopping Inclusivo",

        type: "Shopping Center",

        address: "Rua Haddock Lobo, 500",

        distance: "0,8 km",

        position: {
            lat: -23.5605,
            lng: -46.6600
        },

        score: 95,

        accessibility: {
            wheelchair: true,
            visual: true,
            hearing: true,
            autism: true,
            elderly: true
        },

        features: [
            "Rampas",
            "Elevadores",
            "Banheiros acessíveis",
            "Piso tátil",
            "Funcionários com Libras",
            "Sala de baixa estimulação"
        ]
    },


    {
        id: 3,

        name: "Mercado Bairro Azul",

        type: "Supermercado",

        address: "Rua Bela Cintra, 800",

        distance: "1,1 km",

        position: {
            lat: -23.5560,
            lng: -46.6580
        },

        score: 88,

        accessibility: {
            wheelchair: true,
            visual: true,
            hearing: false,
            autism: true,
            elderly: true
        },

        features: [
            "Entrada sem degraus",
            "Carrinho acessível",
            "Banheiro acessível",
            "Piso tátil",
            "Horário tranquilo"
        ]
    },


    {
        id: 4,

        name: "Cine Acesso",

        type: "Cinema",

        address: "Rua Augusta, 1200",

        distance: "1,5 km",

        position: {
            lat: -23.5550,
            lng: -46.6460
        },

        score: 92,

        accessibility: {
            wheelchair: true,
            visual: true,
            hearing: true,
            autism: true,
            elderly: true
        },

        features: [
            "Assentos acessíveis",
            "Audiodescrição",
            "Legendas",
            "Sessões adaptadas",
            "Sala de baixa estimulação"
        ]
    },


    {
        id: 5,

        name: "Café Acolher",

        type: "Cafeteria",

        address: "Rua Oscar Freire, 300",

        distance: "1,8 km",

        position: {
            lat: -23.5638,
            lng: -46.6720
        },

        score: 84,

        accessibility: {
            wheelchair: true,
            visual: false,
            hearing: true,
            autism: true,
            elderly: true
        },

        features: [
            "Rampa",
            "Atendimento em Libras",
            "Ambiente silencioso",
            "Mesas acessíveis"
        ]
    }

];


// ============================================
// VARIÁVEIS
// ============================================

let map;

let markers = [];

let selectedPreferences = [];

let userLocation = null;

let speechEnabled = false;


// ============================================
// ELEMENTOS
// ============================================

const welcomeScreen =
    document.getElementById("welcomeScreen");

const app =
    document.getElementById("app");

const startButton =
    document.getElementById("startButton");

const speakButton =
    document.getElementById("speakButton");

const locationButton =
    document.getElementById("locationButton");

const placesList =
    document.getElementById("placesList");

const resultCount =
    document.getElementById("resultCount");

const searchInput =
    document.getElementById("searchInput");

const placeModal =
    document.getElementById("placeModal");

const modalContent =
    document.getElementById("modalContent");

const closeModal =
    document.getElementById("closeModal");


// ============================================
// INICIAR APLICAÇÃO
// ============================================

startButton.addEventListener("click", () => {

    welcomeScreen.classList.add("hidden");

    app.classList.remove("hidden");

    speak(
        "Bem-vindo ao Acesso Mais. " +
        "Escolha suas necessidades de acessibilidade."
    );

    updatePlaces();
});


// ============================================
// VOZ
// ============================================

function speak(text) {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }

    if (!speechEnabled) {
        return;
    }

    window.speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(text);

    utterance.lang = "pt-BR";

    utterance.rate = 0.9;

    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
}


speakButton.addEventListener("click", () => {

    speechEnabled = !speechEnabled;

    speakButton.textContent =
        speechEnabled ? "🔊" : "🔇";

    speakButton.setAttribute(
        "aria-label",
        speechEnabled
            ? "Desativar leitura por voz"
            : "Ativar leitura por voz"
    );

    if (speechEnabled) {

        speak(
            "Leitura por voz ativada. " +
            "Você pode navegar pelo Acesso Mais usando os controles da tela."
        );

    }

});


// ============================================
// PREFERÊNCIAS
// ============================================

document
    .querySelectorAll(".accessibility-option input")
    .forEach(input => {

        input.addEventListener("change", () => {

            selectedPreferences =
                [...document.querySelectorAll(
                    ".accessibility-option input:checked"
                )]
                .map(item => item.value);

            updatePlaces();

            const count =
                selectedPreferences.length;

            if (count > 0) {

                speak(
                    `${count} necessidades selecionadas. ` +
                    "O mapa foi atualizado."
                );

            }

        });

    });


// ============================================
// FILTRAR LOCAIS
// ============================================

function getFilteredPlaces() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    let filtered = [...places];


    // Filtro de pesquisa
    if (search) {

        filtered =
            filtered.filter(place =>

                place.name
                    .toLowerCase()
                    .includes(search)

                ||

                place.type
                    .toLowerCase()
                    .includes(search)

                ||

                place.address
                    .toLowerCase()
                    .includes(search)

            );

    }


    // Filtro de acessibilidade
    if (selectedPreferences.length > 0) {

        filtered =
            filtered.filter(place => {

                return selectedPreferences
                    .every(preference =>
                        place.accessibility[preference]
                    );

            });

    }


    // Mais acessíveis primeiro
    filtered.sort(
        (a, b) => b.score - a.score
    );


    return filtered;
}


// ============================================
// ATUALIZAR INTERFACE
// ============================================

function updatePlaces() {

    const filtered =
        getFilteredPlaces();


    renderPlaces(filtered);

    updateMarkers(filtered);


    resultCount.textContent =
        `${filtered.length} ${
            filtered.length === 1
                ? "local"
                : "locais"
        }`;


    const title =
        selectedPreferences.length
            ? "Melhores para você"
            : "Locais recomendados";


    document.getElementById(
        "resultsTitle"
    ).textContent = title;

}


// ============================================
// CARDS
// ============================================

function renderPlaces(data) {

    placesList.innerHTML = "";


    if (data.length === 0) {

        placesList.innerHTML = `

            <div class="place-card">

                <h3 class="place-name">
                    Nenhum local encontrado
                </h3>

                <p class="place-address">
                    Tente remover algum filtro ou
                    buscar por outro tipo de estabelecimento.
                </p>

            </div>

        `;

        return;
    }


    data.forEach(place => {

        const card =
            document.createElement("article");

        card.className = "place-card";

        card.tabIndex = 0;

        card.innerHTML = `

            <div class="place-top">

                <div>

                    <span class="place-type">
                        ${place.type}
                    </span>

                    <h3 class="place-name">
                        ${place.name}
                    </h3>

                </div>

                <span class="score">
                    ${place.score}%
                </span>

            </div>


            <p class="place-address">
                📍 ${place.address}
            </p>


            <div class="tags">

                ${createTags(place)}

            </div>


            <div class="place-footer">

                <span class="distance">
                    ${place.distance}
                </span>

                <button
                    class="details-button"
                    type="button"
                >
                    Ver detalhes
                </button>

            </div>

        `;


        card.addEventListener(
            "click",
            () => showPlace(place)
        );


        card.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    showPlace(place);

                }

            }
        );


        placesList.appendChild(card);

    });

}


// ============================================
// TAGS
// ============================================

function createTags(place) {

    const tags = [];


    if (place.accessibility.wheelchair) {

        tags.push(
            `<span class="tag good">♿ Rampa</span>`
        );

    }


    if (place.accessibility.visual) {

        tags.push(
            `<span class="tag yellow">👁 Visual</span>`
        );

    }


    if (place.accessibility.hearing) {

        tags.push(
            `<span class="tag blue">🤟 Libras</span>`
        );

    }


    if (place.accessibility.autism) {

        tags.push(
            `<span class="tag good">🧩 Tranquilo</span>`
        );

    }


    return tags.join("");

}


// ============================================
// MODAL
// ============================================

function showPlace(place) {

    const items = [

        {
            icon: "♿",
            name: "Acesso para cadeirantes",
            value: place.accessibility.wheelchair,
            description:
                "Rampas, entrada e estrutura acessível."
        },

        {
            icon: "👁",
            name: "Acessibilidade visual",
            value: place.accessibility.visual,
            description:
                "Recursos para pessoas com deficiência visual."
        },

        {
            icon: "🤟",
            name: "Atendimento em Libras",
            value: place.accessibility.hearing,
            description:
                "Atendimento para pessoas surdas."
        },

        {
            icon: "🧩",
            name: "Ambiente adaptado",
            value: place.accessibility.autism,
            description:
                "Ambiente com menor estímulo sensorial."
        },

        {
            icon: "🧓",
            name: "Mobilidade reduzida",
            value: place.accessibility.elderly,
            description:
                "Assentos, elevadores e circulação facilitada."
        }

    ];


    modalContent.innerHTML = `

        <span class="section-label">
            ${place.type}
        </span>

        <h2 id="modalTitle" class="modal-title">
            ${place.name}
        </h2>

        <p class="modal-subtitle">
            📍 ${place.address}
        </p>


        <div class="accessibility-score">

            <strong>
                ${place.score}%
            </strong>

            <div>
                <b>Índice de acessibilidade</b>

                <p>
                    Avaliação baseada nas informações disponíveis.
                </p>
            </div>

        </div>


        <div class="accessibility-grid">

            ${items.map(item => `

                <div class="
                    accessibility-item
                    ${item.value ? "available" : "unavailable"}
                ">

                    <strong>
                        ${item.icon}
                        ${item.name}
                    </strong>

                    <span>
                        ${item.value
                            ? "✓ Disponível"
                            : "Não informado"}
                    </span>

                    <span>
                        ${item.description}
                    </span>

                </div>

            `).join("")}

        </div>


        <div class="accessibility-grid">

            ${place.features.map(feature => `

                <div class="
                    accessibility-item
                    available
                ">

                    <strong>
                        ✓ ${feature}
                    </strong>

                    <span>
                        Recurso informado pelo local.
                    </span>

                </div>

            `).join("")}

        </div>


        <button
            class="modal-action"
            type="button"
            onclick="openDirections(${place.id})"
        >
            🧭 Como chegar
        </button>

    `;


    placeModal.classList.remove("hidden");


    speak(
        `${place.name}. ` +
        `Índice de acessibilidade ${place.score} por cento. ` +
        `${place.features.join(", ")}.`
    );

}


// ============================================
// FECHAR MODAL
// ============================================

closeModal.addEventListener(
    "click",
    closePlaceModal
);


document
    .querySelector(".modal-overlay")
    .addEventListener(
        "click",
        closePlaceModal
    );


function closePlaceModal() {

    placeModal.classList.add("hidden");

}


// ============================================
// GOOGLE MAPS
// ============================================

function initMap() {

    const saoPaulo = {
        lat: -23.5617,
        lng: -46.6560
    };


    map = new google.maps.Map(
        document.getElementById("map"),
        {

            center: saoPaulo,

            zoom: 14,

            mapTypeControl: true,

            fullscreenControl: true,

            streetViewControl: true,

            zoomControl: true,

            gestureHandling: "greedy",

            mapId: "ACESSO_MAP"

        }
    );


    document
        .querySelector(".map-loading")
        ?.remove();


    updateMarkers(
        getFilteredPlaces()
    );

}


// ============================================
// MARCADORES
// ============================================

function updateMarkers(data) {

    if (!map) {
        return;
    }


    markers.forEach(marker => {

        marker.setMap(null);

    });


    markers = [];


    data.forEach(place => {

        const marker =
            new google.maps.Marker({

                map,

                position: place.position,

                title: place.name,

                label: {
                    text: "♿",
                    color: "#ffffff"
                }

            });


        marker.addListener(
            "click",
            () => {

                showPlace(place);

            }
        );


        markers.push(marker);

    });

}


// ============================================
// LOCALIZAÇÃO DO USUÁRIO
// ============================================

locationButton.addEventListener(
    "click",
    useUserLocation
);


function useUserLocation() {

    if (!navigator.geolocation) {

        alert(
            "Seu navegador não suporta localização."
        );

        return;

    }


    locationButton.textContent =
        "📍 Localizando...";


    navigator.geolocation.getCurrentPosition(

        position => {

            userLocation = {

                lat: position.coords.latitude,

                lng: position.coords.longitude

            };


            if (map) {

                map.setCenter(
                    userLocation
                );

                map.setZoom(15);


                new google.maps.Marker({

                    map,

                    position: userLocation,

                    title: "Você está aqui",

                    icon: {
                        path:
                            google.maps.SymbolPath.CIRCLE,

                        scale: 9,

                        fillColor: "#198ed1",

                        fillOpacity: 1,

                        strokeColor: "#ffffff",

                        strokeWeight: 3
                    }

                });

            }


            locationButton.textContent =
                "✓ Minha localização";


            speak(
                "Sua localização foi encontrada. " +
                "O mapa foi centralizado em você."
            );

        },

        error => {

            console.error(error);

            locationButton.textContent =
                "📍 Usar minha localização";


            alert(
                "Não foi possível acessar sua localização. " +
                "Verifique as permissões do navegador."
            );

        }

    );

}


// ============================================
// COMO CHEGAR
// ============================================

function openDirections(id) {

    const place =
        places.find(
            item => item.id === id
        );


    if (!place) {
        return;
    }


    const destination =
        `${place.position.lat},${place.position.lng}`;


    const url =
        `https://www.google.com/maps/dir/?api=1&destination=${destination}`;


    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}


// ============================================
// BUSCA
// ============================================

searchInput.addEventListener(
    "input",
    updatePlaces
);


// ============================================
// TECLADO
// ============================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            !placeModal.classList.contains("hidden")
        ) {

            closePlaceModal();

        }

    }
);


// ============================================
// FALLBACK CASO GOOGLE MAPS NÃO CARREGUE
// ============================================

window.gm_authFailure = function () {

    const mapElement =
        document.getElementById("map");


    mapElement.innerHTML = `

        <div class="map-loading">

            <strong>
                Não foi possível carregar o Google Maps.
            </strong>

            <span>
                Verifique sua API Key e as APIs
                habilitadas no Google Cloud.
            </span>

        </div>

    `;

};
