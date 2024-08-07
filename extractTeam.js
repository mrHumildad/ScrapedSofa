const fs = require('fs');
const getAttributes = require('./getAttributes'); // Ensure correct import

function url2Id(url) {
  const regex = /\/player\/[^/]+\/(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

function changeTab(url) {
  const squadTab = '#tab:squad';
  const detailsTab = '#tab:details';

  if (url.includes(squadTab)) {
    return url.replace(squadTab, detailsTab);
  } else if (url.includes(detailsTab)) {
    return url.replace(detailsTab, squadTab);
  } else {
    return url.includes('#') ? url : url + squadTab;
  }
}

async function extractTeam(page, url, id, nat) {
  let team = { id: id, colors: [], stadium: { name: '', capacity: 0 } };
  await page.goto(url, { timeout: 200000, waitUntil: 'domcontentloaded' });
  const nextData = await page.$eval('#__NEXT_DATA__', el => el.textContent);
  const data = JSON.parse(nextData).props.pageProps;
  // Logging the data structure for debuggingteam
  //console.log(JSON.stringify(data, null, 2));
  //console.log(data.teamDetails)
  team.abbr = data.teamDetails.nameCode;
  team.name = data.teamDetails.name;
  team.nat = nat;
  team.colors = data.teamDetails.teamColors;
  team.city = data.teamDetails.venue.city.name;
  team.coachId = data.teamDetails.manager.id;
  const playersArr = data.players.players; // Array of players
   // Coach information
  team.coachLink = 'https://www.sofascore.com/manager/' +  data.teamDetails.manager.slug + '/' + data.teamDetails.manager.id
  console.log(team.coachLink);
  team.stadium.name = data.teamDetails.venue.stadium.name;
  team.stadium.capacity = data.teamDetails.venue.stadium.capacity;
  const followerSelector = 'span.Text.jpoqeG';
  const followerElement = await page.$(followerSelector);
  if (followerElement) {
    const followers = await followerElement.evaluate(node => node.textContent.trim());
    team.followers = followers;
  }
  //console.log('Followers:', team.followers);

  team.roster = await Promise.all(playersArr.map(async (player) => {
    const playerInfo = player.player;
    const plUrl = `https://www.sofascore.com/player/${playerInfo.slug}/${playerInfo.id}`;
    // Return player data along with URL
    return {
      name: playerInfo.shortName,
      team: team.id,
      url: plUrl,
      id: playerInfo.id,
      position: playerInfo.position,
      jerseyNumber: playerInfo.jerseyNumber,
      height: playerInfo.height,
      preferredFoot: playerInfo.preferredFoot,
      country: playerInfo.country.alpha3,
      shirtNumber: playerInfo.shirtNumber,
      dateOfBirth: playerInfo.dateOfBirthTimestamp,
      marketValue: playerInfo.proposedMarketValue,
      attr: null
    };
  }));
  //console.log(team);
  return team;
}

module.exports = extractTeam;
