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

GSheetReader(options, results => {
  if (options.theme == 'light') {
    document.body.classList.add('light');
  } else {
    document.body.classList.add('dark');
  }
  const timeslotCount = results.length;
  console.log(`We got ${timeslotCount} timeslots!`);
  const customStyles = document.querySelector('.container style');
  const title = document.querySelector('.train-title');
  const image = document.querySelector('.train-image');
  const trainImage = results[0]["Image URL"];
  const imageMax = results[0]["Image width"];
  const blurb = document.querySelector('.train-blurb');
  const main = document.querySelector('.dj-list');
  const links = document.querySelector('.twitch-cta');
  const linkColor = results[0]["Link color"];
  const timeHolder = document.querySelector('.timenow');
  const now = DateTime.now().toLocaleString(DateTime.DATETIME_MED);
  const where = DateTime.locale;
  const columns = results[0]["Columns"];

  let localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    , selectedIANA = localTimezone
    , currentTimezoneLocale = localTimezone.split("/").pop().replaceAll(/_/gi, " ");

  let currentDateList = "";
  let newDate = true;
  let currentDJ = "";  

  timeHolder.innerHTML = `<p>All listings are in ${currentTimezoneLocale} time.<br />Your current time is ${now}`;

  title.innerHTML = results[0]["Raid Title"];
  blurb.innerHTML = results[0]["Blurb"];

  if(trainImage != '') {
    image.alt=`${title}`;
    image.src=`${trainImage}`;
    customStyles.innerHTML += `
      .train-image{max-width: ${imageMax};}
    `;
  }

  if(linkColor != '') {
    customStyles.innerHTML += `
      .twitch-cta {
        color: ${linkColor}!important;
      }
    `;
  }

  if (columns != '')  
    main.style.columnCount = columns;

  setTimeout(() => {
    document.querySelector('.loader').classList.add('hidden'); 
    document.title = `${results[0]["Raid Title"]} Schedule`;
  }, 3000);

  results.forEach((result, index) => {
    if (result["Twitch handle"]) {
      if((result["DJ Name"] == currentDJ) && (index <= timeslotCount)) {
        return;
      }
      let isLive = false;
      let hasLocation = true;
      let hasGenre = true;
      if (result["Location"] == "")
        hasLocation = false;
      if (result["Genre"] == "")
        hasGenre = false;
      const gmtTime = result["DateTime"];
      let convertedTime = DateTime.fromISO(gmtTime);
      convertedTime = convertedTime.setZone(localTimezone);
      if (index < timeslotCount - 1) {
        let nextTime = results[index + 1].TimeDate;
        nextTime = DateTime.fromISO(nextTime);
        nextTime = nextTime.setZone(localTimezone);
        if ((DateTime.now() > convertedTime) && (DateTime.now() < nextTime)) {
          isLive = true;
        }
      } else if ((DateTime.now() > convertedTime)) {
        isLive = true;
      }
      let newDateList = convertedTime.toLocaleString(DateTime.DATE_MED);
      if (newDateList != currentDateList) {
        newDate = true;
        currentDateList = newDateList;
      }
      convertedTime = convertedTime.toLocaleString(DateTime.TIME_SIMPLE);
      const dateHeader = `<li class="date-header">${currentDateList}</li>`
      const listItem = `<li${isLive ? ' class="live"' : ''}><a class="twitch-cta d-block" href="https://twitch.tv/${(result["Twitch handle"])}" target="_blank">${convertedTime} - ${(result["DJ Name"])}${isLive ? ' - <span class="live-now">LIVE NOW!</span>' : ''}</a>${hasLocation ? `<span class="location d-block">From: ${result["Location"]}` : ''}${hasGenre ? `</span><span class="genre d-block">Genre: ${result["Genre"]}` : ''}</span> </li>`;

      if (newDate) {
        main.innerHTML += dateHeader;
        newDate = false;
      }
      main.innerHTML += listItem;
      currentDJ = result["DJ Name"];
      console.log(result["DJ Name"]);
    }
  });
}).catch (err => {
  console.log(err);
});