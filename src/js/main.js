const GSheetReader = require('g-sheets-api');
const loadGoogleMapsApi = require('load-google-maps-api');
const mapboxgl = require('mapbox-gl');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const options = {
  apiKey: process.env.API_KEY,
  mapboxKey: process.env.MAPBOX_KEY,
  sheetId: urlParams.get('raid'),
  sheetNumber: urlParams.get('num'),
  theme: urlParams.get('theme'),
  returnAllResults: true
}


let DateTime = luxon.DateTime;

setInterval(() => {
  if (DateTime.now().c.minute == '00') {
    location.reload();
  }
}, 60000);

let map;
let geocoder;
let mapQueries = 0;
let overage = 0;

function codeAddress(address) {
  mapQueries++;           
  
  fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${options.mapboxKey}`)
  .then(response => response.json())
  .then(data => {
    let location = {lat: data.features[0].center[1], lng: data.features[0].center[0]};
    console.log(location);
    let marker = new google.maps.Marker(
      {
        map: map,
        position: location
      }
    );
  });
}

loadGoogleMapsApi({ key: process.env.API_KEY }).then(function (googleMaps) {
  map = new googleMaps.Map(document.querySelector('.map'), {
    center: {
      lat: 40.7484405,
      lng: -73.9944191
    },
    zoom: 1,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }],
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }],
      },
      {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }],
      },
      {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }],
      },
      {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }],
      },
      {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }],
      },
    ],    
  });
  geocoder = new google.maps.Geocoder();
}).catch(function (error) {
  console.error(error)
})


GSheetReader(options, results => {
  if (options.theme == 'light') {
    document.body.classList.add('light');
  } else {
    document.body.classList.add('dark');
  }
  const timeslotCount = results.length;
  const customStyles = document.querySelector('.container style');
  const title = document.querySelector('.train-title');
  const image = document.querySelector('.train-image');
  const trainImage = results[0]["Image URL"];
  const imageMax = results[0]["Image width"];
  const alignment = results[0]["Image alignment"];
  const blurb = document.querySelector('.train-blurb');
  const main = document.querySelector('.dj-list');
  const slotLength = parseInt(results[0]["Timeslot length"]);
  const nowPlaying = document.querySelector('.now-playing');
  const linkColor = results[0]["Link color"];
  const timeHolder = document.querySelector('.timenow');
  const columns = results[0]["Columns"];

  let localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    , selectedIANA = localTimezone
    , currentTimezoneLocale = localTimezone.split("/").pop().replaceAll(/_/gi, " ");

  let currentDateList = "";
  let newDate = true;
  let currentDJ = "";

  setInterval(() => {
    let now = DateTime.now().toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
    timeHolder.innerHTML = `<p>All listings are in ${currentTimezoneLocale} time.<br />Your current time is ${now}`;
  }, 1000);


  title.innerHTML = results[0]["Raid Title"];
  blurb.innerHTML = results[0]["Blurb"];

  if (trainImage != '') {
    image.alt = `${title}`;
    image.src = `${trainImage}`;
    customStyles.innerHTML += `
      .train-image{max-width: ${imageMax};}
    `;
  }

  if (alignment == 'left') {
    document.querySelector('.content').classList.add('left');
  }

  if (linkColor != '') {
    customStyles.innerHTML += `
      .twitch-cta, footer a {
        color: ${linkColor}!important;
      }
    `;
  }

  if (columns != '') {
    if (columns == 1) {
      main.style.columnCount = 'auto';
    } else {
      main.style.columnCount = columns;
    }
  }

  document.querySelector('meta[property="og:title"]').setAttribute('content', `${results[0]["Raid Title"]} Schedule`);
  setTimeout(() => {
    document.querySelector('.loader').classList.add('hidden');
    document.title = `${results[0]["Raid Title"]} Schedule`;
  }, 3000);

  results.forEach((result, index) => {
    if (result["Twitch handle"]) {
      if ((result["DJ Name"] == currentDJ) && (index <= timeslotCount)) {
        return;
      }
      let isLive = false;
      let hasLocation = true;
      let hasGenre = true;
      if (result["Location"] == "") {
        hasLocation = false;
      } else {
        codeAddress(result["Location"]);
      }
      if (result["Genre"] == "")
        hasGenre = false;
      let slotTime = result["DateTime"];
      let convertedTime = DateTime.fromISO(slotTime);
      convertedTime = convertedTime.setZone(localTimezone);
      if (index < timeslotCount - 1) {
        let nextIndex = index + slotLength;
        let nextTime = results[nextIndex].DateTime;
        slotTime = DateTime.fromISO(slotTime);
        nextTime = DateTime.fromISO(nextTime);
        if ((DateTime.now() > slotTime) && (DateTime.now() < nextTime)) {
          isLive = true;
        }
      } else if ((DateTime.now() > slotTime)) {
        isLive = true;
      }
      let newDateList = convertedTime.toLocaleString(DateTime.DATE_MED);
      if (newDateList != currentDateList) {
        newDate = true;
        currentDateList = newDateList;
      }
      convertedTime = convertedTime.toLocaleString(DateTime.TIME_SIMPLE);
      const dateHeader = `<li class="date-header">${currentDateList}</li>`
      const listItem = `<li${isLive ? ' class="live"' : ''}><a class="twitch-cta" href="https://twitch.tv/${(result["Twitch handle"])}" target="_blank">${convertedTime} - ${(result["DJ Name"])}${isLive ? ' - <span class="live-now">LIVE NOW!</span>' : ''}</a>${hasLocation ? `<span class="location d-block">${result["Location"]}</span>` : ''}${hasGenre ? `<span class="genre d-block">${result["Genre"]}` : ''}</span> </li>`;

      if (newDate) {
        main.innerHTML += dateHeader;
        newDate = false;
      }
      main.innerHTML += listItem;
      currentDJ = result["DJ Name"];

      if (isLive) {
        nowPlaying.innerHTML = `<h2>NOW PLAYING:</h2> <a class="twitch-cta" href="https://twitch.tv/${(result["Twitch handle"])}" target="_blank">${(result["DJ Name"])}</a>${hasLocation ? ` from <span class="location">${result["Location"]}</span>` : ''}${hasGenre ? `, playing <span class="genre">${result["Genre"]}` : ''}</span>`;
      }

    }
  });
}).catch(err => {
  console.log(err);
  document.querySelector('.loader').classList.add('hidden');
  document.querySelector('.content').classList.add('hidden');
  document.querySelector('.error').classList.add('visible');
});