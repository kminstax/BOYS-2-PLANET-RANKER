// Takes in name of csv and populates necessary data in table
function readFromCSV(path) {
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", path, false);
  rawFile.onreadystatechange = function() {
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status == 0) {
        let allText = rawFile.responseText;
        let out = CSV.parse(allText);
        let trainees = convertCSVArrayToTraineeData(out);
        populateTable(trainees);
      }
    }
  };
  rawFile.send(null);
}

function findTraineeById(id) {
  for (let i = 0; i < trainees.length; i++) {
    if (id === trainees[i].id) { // if trainee's match
      return trainees[i];
    }
  }
  return newTrainee();
}

// If the user has saved a ranking via id, then recover it here
function getRanking() {
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("r")) {
    let rankString = atob(urlParams.get("r")) // decode the saved ranking
    let rankingIds = [];
    for (let i = 0; i < rankString.length; i += 2) {
      let traineeId = rankString.substr(i, 2); // get each id of the trainee by substringing every 2 chars
      rankingIds.push(parseInt(traineeId));
    }
    console.log(rankingIds);
    // use the retrieved rankingIds to populate ranking
    for (let i = 0; i < rankingIds.length; i++) {
      traineeId = rankingIds[i];
      if (traineeId < 0) {
        ranking[i] = newTrainee();
      } else {
        let trainee = findTraineeById(rankingIds[i])
        // let trainee = trainees[rankingIds[i]];
        trainee.selected = true;
        ranking[i] = trainee;
      }
    }
    // refresh table to show checkboxes
    rerenderTable();
    // refresh ranking to show newly inserted trainees
    rerenderRanking();
    console.log(ranking);
  }
}

// Takes in an array of trainees and converts it to js objects
// Follows this schema:
/*
trainee: {
  number: ... // position in csv used for simple recognition
  name_romanized: ...
  name_hangul: ...
  name_chinese: ...
  nationality: ...
  birthyear: ...
  rank: ...
  id: ...
  image: ...
  selected: false/true // whether user selected them
  eliminated: false/true
  top8: false/true
}
*/
function convertCSVArrayToTraineeData(csvArrays) {
  trainees = csvArrays.map(function(traineeArray, index) {
    trainee = {};
    trainee.name_romanized = traineeArray[0];
    if (traineeArray[2] === "-") {
      // trainee only has hangul
      trainee.name_hangul = traineeArray[1];
    } else {
      trainee.name_japanese = traineeArray[1];
      trainee.name_hangul = traineeArray[2];
    }
    trainee.nationality = traineeArray[3];
    trainee.birthyear = traineeArray [4];
    trainee.number = traineeArray[5];
    trainee.eliminated = traineeArray[6] === 'e'; // sets trainee to be eliminated if 'e' appears in 6th col
    trainee.top6 = traineeArray[6] === 't'; // sets trainee to top 8 if 't' appears in 6th column
    trainee.id = parseInt(traineeArray[8]) - 1; // trainee id is the original ordering of the trainees in the first csv
    trainee.image =
      trainee.name_romanized.replaceAll(" ", "").replaceAll("-", "") + ".png";
    return trainee;
  });
  filteredTrainees = trainees;
  return trainees;
}

// Constructor for a blank trainee
function newTrainee() {
  return {
    id: -1, // -1 denotes a blank trainee spot
    name_romanized: '&#8203;', // this is a blank character
    number: '&#8203;', // this is a blank character
    birthyear: '&#8203;',
    nationality: '&#8203;',
    rank: 'no',
    image: 'emptyrank.png',
  };
}

// Constructor for a blank ranking list
function newRanking() {
  // holds the ordered list of rankings that the user selects
  let ranking = new Array(12);
  for (let i = 0; i < ranking.length; i++) {
    ranking[i] = newTrainee();
  }
  return ranking;
}

// rerender method for table (search box)
// TODO: this site might be slow to rerender because it clears + adds everything each time
function rerenderTable() {
  clearTable();
  populateTable(filteredTrainees);
  // populateRanking();
}

// rerender method for ranking
function rerenderRanking() {
  clearRanking();
  populateRanking();
}

function removeAllChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

// Clears out the table
function clearTable() {
  let table = document.getElementById("table__entry-container");
  removeAllChildren(table);
}

// Clears out the ranking
function clearRanking() {
  // Currently just duplicates first ranking entry
  let ranking_chart = document.getElementById("ranking__pyramid");
  let rankRows = Array.from(ranking_chart.children).slice(1); // remove the title element
  // let rankEntry = rankRows[0].children[0];
  for (let i = 0; i < rowNums.length; i++) {
    let rankRow = rankRows[i];
    for (let j = 0; j < rowNums[i]; j++) {
      removeAllChildren(rankRow);
    }
  }
}

// Uses populated local data structure from readFromCSV to populate table
function populateTable(trainees) {
  // Currently just duplicates the first table entry
  let table = document.getElementById("table__entry-container");
  exampleEntry = table.children[0];
  for (let i = 0; i < trainees.length; i++) {
    // generate and insert the html for a new trainee table entry
    table.insertAdjacentHTML("beforeend", populateTableEntry(trainees[i]));
    // add the click listener to the just inserted element
    let insertedEntry = table.lastChild;
    insertedEntry.addEventListener("click", function (event) {
      tableClicked(trainees[i]);
    });
  }
}

function populateTableEntry(trainee) {
  // eliminated will have value "eliminated" only if trainee is eliminated and showEliminated is true, otherwise this is ""
  let eliminated = (showEliminated && trainee.eliminated) && "eliminated";
  let top6 = (showTop6 && trainee.top6) && "top6";
  const tableEntry = `
  <div class="table__entry ${eliminated}">
    <div class="table__entry-icon">
      <img class="table__entry-img" src="Assets/Trainees/${Trainee.image}" />
      <div class="table__entry-icon-border ${Trainee.grade.toLowerCase()}-rank-border"></div>
      ${
        top6 ? '<div class="table__entry-icon-crown"></div>' : ''
      }
      ${
        trainee.selected ? '<img class="table__entry-check" src="Assets/check.png"/>' : ""
      }
    </div>
    <div class="table__entry-text">
      <span class="numberandname"><strong>${trainee.number_name_romanized}</strong></span>
      <span class="hangul">(${trainee.name_hangul})</span>
      <span class="birthyear">(${trainee.birthyear})</span>
    </div>
  </div>`;
  return tableEntry;
}

// Uses populated local data structure from getRanking to populate ranking
function populateRanking() {
  // Currently just duplicates first ranking entry
  let ranking_chart = document.getElementById("ranking__pyramid");
  let rankRows = Array.from(ranking_chart.children).slice(1); // remove the title element
  // let rankEntry = rankRows[0].children[0];
  let currRank = 1;
  for (let i = 0; i < rowNums.length; i++) {
    let rankRow = rankRows[i];
    for (let j = 0; j < rowNums[i]; j++) {
      let currTrainee = ranking[currRank-1];
      rankRow.insertAdjacentHTML("beforeend", populateRankingEntry(currTrainee, currRank))

      let insertedEntry = rankRow.lastChild;
      let dragIcon = insertedEntry.children[0].children[0]; // drag icon is just the trainee image and border
      let iconBorder = dragIcon.children[1]; // this is just the border and the recipient of dragged elements
      // only add these event listeners if a trainee exists in this slot
      if (currTrainee.id >= 0) {
        // add event listener to remove item
        insertedEntry.addEventListener("click", function (event) {
          rankingClicked(currTrainee);
        });
        // add event listener for dragging
        dragIcon.setAttribute('draggable', true);
        dragIcon.classList.add("drag-cursor");
        dragIcon.addEventListener("dragstart", createDragStartListener(currRank - 1));
      }
      // add event listeners for blank/filled ranking entries
      iconBorder.addEventListener("dragenter", createDragEnterListener());
      iconBorder.addEventListener("dragleave", createDragLeaveListener());
      iconBorder.addEventListener("dragover", createDragOverListener());
      iconBorder.addEventListener("drop", createDropListener());
      // }
      currRank++;
    }
  }
}

const abbreviatedNationalities = {
  "JAPAN": "JPN 🇯🇵",
  "CHINA": "CHN 🇨🇳",
  "SOUTH KOREA": "KOR 🇰🇷",
  "CANADA": "CAN 🇨🇦",
  "AUSTRALIA": "AUS 🇦🇺",
  "THAILAND": "THA 🇹🇭",
  "MONGOLIA": "MNG 🇲🇳",
  "MYANMAR": "MMR 🇲🇲",
  "ITALY": "ITA 🇮🇹",
  "PHILIPPINES": "PHL 🇵🇭",
  "MALAYSIA": "MYS 🇲🇾",
  "JAPAN/FRANCE": "JPN/FRA 🇯🇵🇫🇷",
  "VIETNAM": "VNM 🇻🇳",
  "JAPAN/AUSTRALIA": "JPN/AUS 🇯🇵🇦🇺"
}

function populateRankingEntry(trainee, currRank) {
  let modifiedNationality = trainee.birthyear;
  let eliminated = (showEliminated && trainee.eliminated) && "eliminated";
  let top6 = (showTop6 && trainee.top6) && "top6";
  const rankingEntry = `
  <div class="ranking__entry ${eliminated}">
    <div class="ranking__entry-view">
      <div class="ranking__entry-icon">
        <img class="ranking__entry-img" src="Assets/Trainees/${Trainee.image}" />
        <div class="ranking__entry-icon-border ${Trainee.grade.toLowerCase()}-rank-border" data-rankid="${currRank-1}"></div>
      </div>
      <div class="ranking__entry-icon-badge bg-${Trainee.grade.toLowerCase()}">${currRank}</div>
      ${
        top6 ? '<div class="ranking__entry-icon-crown"></div>' : ''
      }
    </div>
    <div class="ranking__row-text">
      <div class="name"><strong>${trainee.name_romanized}</strong></div>
      <div class="nationality">${modifiedNationality}</div>
    </div>
  </div>`;
  return rankingEntry;
}

// Event handlers for table
function tableClicked(trainee) {
  if (trainee.selected) {
    // Remove the trainee from the ranking
    let success = removeRankedTrainee(trainee);
    if (success) { // if removed successfully
      trainee.selected = !trainee.selected;
    } else {
      return;
    }
  } else {
    // Add the trainee to the ranking
    let success = addRankedTrainee(trainee);
    if (success) { // if added successfully
      trainee.selected = true;
    } else {
      return;
    }
  }
  rerenderTable();
  rerenderRanking();
}

// Event handler for ranking
function rankingClicked(trainee) {
	if (trainee.selected) {
    trainee.selected = !trainee.selected;
    // Remove the trainee from the ranking
    removeRankedTrainee(trainee);
  }
  rerenderTable();
	rerenderRanking();
}

function swapTrainees(index1, index2) {
  tempTrainee = ranking[index1];
  ranking[index1] = ranking[index2];
  ranking[index2] = tempTrainee;
  rerenderRanking();
}

// Controls alternate ways to spell trainee names
// to add new entries use the following format:
// <original>: [<alternate1>, <alternate2>, <alternate3>, etc...]
// <original> is the original name as appearing on csv
// all of it should be lower case
const alternateRomanizations = {
    'he xilong': ['boystory'],
  'jia hanyu': ['boystory'],
  'li zihao': ['boystory'],
  'zhong xing': ['1b1','3d poster'],
  'jo gyehyeon': ['verivery'],
  'krystian': ['boys planet','boys planet 1'],
  'lee dongheon': ['verivery'],
  'xuan hao': ['boys planet','boys planet 1'],
  'yoo kangmin': ['verivery','3d poster'],
  'zheng renyu': ['s.k.y'],
  'yichen': ['project 7'],
  'bang junhyuk': ['win','mcnd'],
  'dang honghai': ['boys planet','boys planet 1'],
  'han harry-june': ['dkb'],
  'kim dongyun': ['drippin','produce x 101','pdx101,'pdx'],
  'kim junseo': ['wei'],
  'lee hyeop': ['drippin','produce x 101','pdx101','pdx'],
  'lee sangwon': ['trainee a'],
  'no huijin': ['mcnd'],
  'song minjae': ['mcnd'],
  'yang heechan': ['dkb'],
  'yoonmin': ['jyp loud'],
  'zhang jiahao': ['makemate1','ma1'],
  'han chris': ['blitzers'],
  'guo zhen': ['s.k.y'],
  'xie yuxin': ['universe league'],
  'park junil': ['trainee a'],
  'fujimaki taiga': ['nizi project'],
  'huang xinyu': ['scool'],
  'seowon': ['nine.i','boys planet','boys planet 1'],
  'sun hengyu': ['u','blank2y'],
  'leo',: ['trainee a'],
  'bian shiyu': ['starlight boys','slb'],
  'xie binghua': ['project 7'],
  'kim donghyun': ['jyp loud'],
  'chen jinxin': ['youth with you','youth with you 3'],
  'jiangfan': ['universe league'],
  'jeon leejeong': ['whib'],
  'kim junmin': ['jayder','whib'],
  'moon wonjun': ['whib],
  'na yunseo': ['jyp loud'],
  'thanatorn rueangsuwan': ['the wind'],
  'yeom yechan': ['project 7'],
  'zhou anxin': ['makemate1','ma1','3d poster'],
  'nathparit chokrussameesiri': ['3d poster'],
  'jung sanghyun': ['3d poster'],
  'long guohao': ['fantasy boys','sonyeon pantaji','sonpa'],
  'fredrick choi': ['ciu liyu','choi lipwoo','3d poster'],
  'han ruize': ['youth with you'],
  'inagaki taichi': ['nizi project 2'],
  'sun jiayang': ['starlight boys','slb'],
  'phoenix': ['kandit sittisak','eastshine'],
  'he jinjin': ['universe league'],
  'xu suren': ['under19'],
  'cai jinxin': ['boys planet','boys planet 1'],
  'jung hyunjun': ['makemate1','ma1'],
  'chen lichi': ['rickey','scool'],
  'lynnlynn': ['project 7'],
  'ngan chau yuet': ['starlight boys','slb'],
};

// uses the current filter text to create a subset of trainees with matching info
function filterTrainees(event) {
  let filterText = event.target.value.toLowerCase();
  // filters trainees based on name, alternate names, company, nationality and birth year
  filteredTrainees = Trainees.filter(function (Trainee) {
    let initialMatch = includesIgnCase(Trainee.number, filterText) || includesIgnCase (trainee.name_romanized, filterText) || includesIgnCase (trainee.birthyear, filterText) || includesIgnCase (trainee.nationality, filterText);
    // if alernates exists then check them as well
    let alternateMatch = false;
    let alternates = alternateRomanizations[trainee.name_romanized.toLowerCase()]
    if (alternates) {
      for (let i = 0; i < alternates.length; i++) {
        alternateMatch = alternateMatch || includesIgnCase(alternates[i], filterText);
      }
    }
    return initialMatch || alternateMatch;
  });
  filteredTrainees = sortedTrainees(filteredTrainees);
  rerenderTable();
}

// Checks if mainString includes a subString and ignores case
function includesIgnCase(mainString, subString) {
  return mainString.toString().toLowerCase().includes(subString.toLowerCase());
}

// Finds the first blank spot for
function addRankedTrainee(trainee) {
  for (let i = 0; i < ranking.length; i++) {
    if (ranking[i].id === -1) { // if spot is blank denoted by -1 id
      ranking[i] = trainee;
      return true;
    }
  }
  return false;
}

function removeRankedTrainee(trainee) {
  for (let i = 0; i < ranking.length; i++) {
    if (ranking[i].id === trainee.id) { // if trainee's match
      ranking[i] = newTrainee();
      return true;
    }
  }
  return false;
}

const currentURL = "https://boys2planet.github.io/";
// Serializes the ranking into a string and appends that to the current URL
function generateShareLink() {
  let shareCode = ranking.map(function (trainee) {
    let twoCharID = ("0" + Trainee.id).slice(-2); // adds a zero to front of digit if necessary e.g 1 --> 01
    return twoCharID;
  }).join("");
  console.log(shareCode);
  shareCode = btoa(shareCode);
  let shareNumber = btoa(rowNums.reduce((accumulator, currentValue) => accumulator + currentValue, 0).toString());
  shareURL = currentURL + "?r=" + shareCode + "&n=" + shareNumber;
  showShareLink(shareURL);
}

function lineupNumber(number) {
  const rowsRankLists = {
    2: [1,1],
    3: [1,2],
    4: [2,2],
    5: [2,3],
    6: [1,2,3],
    7:[1,2,4],
    8: [1,3,4],
    9: [1,3,5],
    10:[1,2,3,4],
    11:[1,2,3,5],
    12:[1,2,4,5],
    24:[1,2,3,4,6,8]
  }
  const VALID = Object.hasOwn(rowsRankLists, number);
  if (VALID == true) {

  clearRanking();
  rowNums = rowsRankLists[number];
  populateRanking();

  } else {

  clearRanking();
  rowNums = rowsRankLists[7];
  populateRanking();

  }
  
  document.getElementById('top-number').innerHTML = rowNums.reduce((accumulator, currentValue) => accumulator + currentValue, 0).toString();
}

function showSettings() {
  document.getElementById("settings").style.display = document.getElementById("settings").style.display == "block" ? "none" : "block";
}

function showShareLink(shareURL) {
  let shareBox = document.getElementById("getlink-textbox");
  shareBox.value = shareURL;
  document.getElementById("getlink-textbox").style.display = "block";
  document.getElementById("copylink-button").style.display = "block";
}

function copyLink() {
  let shareBox = document.getElementById("getlink-textbox");
  shareBox.select();
  document.execCommand("copy");
}

// holds the list of all trainees
var trainees = [];
// holds the list of trainees to be shown on the table
var filteredTrainees = [];
// holds the ordered list of rankings that the user selects
var ranking = newRanking();
var rowNums = [1,3,4];
//window.addEventListener("load", function () {
  populateRanking();
  readFromCSV("./trainee_info.csv");
//});
document.getElementById('top-number').innerHTML = rowNums.reduce((accumulator, currentValue) => accumulator + currentValue, 0).toString();
// checks the URL for a ranking and uses it to populate ranking
getRanking();
