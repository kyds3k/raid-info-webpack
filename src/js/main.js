const GSheetReader = require('g-sheets-api');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const options = {
  apiKey: process.env.API_KEY,
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
      if (result["Location"] == "")
        hasLocation = false;
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