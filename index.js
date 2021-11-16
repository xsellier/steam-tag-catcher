const async = require('async')
const request = require('request')

const appIdRatio = {
  RealEstateOnline: {
    397900: 1.3, // Business tour
    562810: 1.0, // Monopoly Plus
    663390: 1.0, // Rento fortune
    403120: 0.8  // Game of life
  },
  CityGameStudio: {
    239820: 1.1,
    1342330: 1.3,
    362620: 1.2,
    399670: 1.0,
    686680: 0.9,
    606800: 0.85,
  },
  SneakIn: {
    329110: 1.1,
    78000: 1.8,
    12500: 1.5,
    3620: 2.0
  },
  Revolt: {
    588650: 1.3,
    219990: 1.1,
    606150: 0.9,
    1367300: 1.0,
    1173200: 1.0,
    1147560: 1.0
  }
}
const appIdList = {
  RealEstateOnline: [
    397900, // Business tour
    562810, // Monopoly Plus
    663390, // Rento fortune
    403120  // Game of life
  ],
  CityGameStudio: [
    // Game Dev Tycoon
    239820,

    // Mad Games Tycoon 2
    1342330,

    // Software Inc
    362620,

    // Game Corp DX
    399670,

    // Computer tycoon
    686680
  ],
  SneakIn: [
    329110,
    78000,
    12500,
    3620,
  ],
  Revolt: [
    588650,
    219990,
    606150,
    1367300,
    1173200,
    1147560
  ]
}
// https://store.steampowered.com/api/appdetails/?appids=

const noWeightTagList = ['Action', 'Adventure', 'Casual', 'Indie']
const poisonTagList = ['Difficult', 'Gore', 'Violent', 'Blood', 'Anime', 'Point & Click', 'Funny', 'Comedy', 'Great Soundtrack', 'Addictive']
var applicationName = process.argv[2]

if (appIdList[applicationName] == null) {
  console.log(`Invalid application name ${applicationName} (${Object.keys(appIdList).join(', ')})`)
  process.exit(1)
}

const fetchTagByAppId = (acc, appId, callback) => {
  request({
    url: `https://store.steampowered.com/app/${appId}/?snr=1_direct-navigation__`,
    headers: {
      'Referer': `https://store.steampowered.com/agecheck/app/${appId}`,
      'Cookie': 'wants_mature_content=1; timezoneOffset=3600,0; birthtime=596934001; lastagecheckage=1-0-1989',
      'Upgrade-Insecure-Requests': 1,
      'DNT': 1
    },
    options: {
      followAllRedirects: true,
      followOriginalHttpMethod: true,
      maxRedirects: 32
    }
  }, (error, response, body) => {
    if (error) {
      console.error('error:', error); // Print the error if one occurred
      callback(error)

    } else {
      if (body.match(/({\s*"tagid"\s*:[^\}].*})/gi) != null) {
        acc[appId] = JSON.parse(`[${body.match(/({\s*"tagid"\s*:[^\}].*})/gi)[0].replace(/:true}/ig,':1}').replace(/:false}/ig,':0}')}]`).slice(0, 15)
        callback(null, acc)
      } else {
        console.log(response)
        console.log(`https://store.steampowered.com/app/${appId}/`)

        callback(null, acc)
      }
    }
  })
}

const commonTags = (tagList) => {
  let common = tagList[Object.keys(tagList)[0]].map((item) => item.name)

  Object.keys(tagList).forEach((appId) => {
    common = common.filter((commonItem) => {
      return tagList[appId].some((subItem) => subItem.name == commonItem)
    })
  })

  return common
}

const mostUsedTags = (tagList) => {
  let mostUsed = tagList[Object.keys(tagList)[0]].map((item) => {
    return {
      name: item.name,
      count: 0,
      used: 0
    }
  })

  Object.keys(tagList).forEach((appId) => {
    tagList[appId].forEach((subItem) => {
      let itemFound = mostUsed.some((mostUsedItem) => {
        if (mostUsedItem.name == subItem.name) {
          mostUsedItem.count += subItem.count
          mostUsedItem.used += appIdRatio[applicationName][appId]
          return true
        }

        return false
      })

      if (!itemFound) {
        mostUsed.push({
          name: subItem.name,
          count: subItem.count,
          used: appIdRatio[applicationName][appId]
        })
      }
    })
  })

  mostUsed.sort((a, b) => b.used - a.used)

  return mostUsed.slice(0, 20)
}

const mostUsedTagsTop5 = (tagList) => {
  let mostUsed = tagList[Object.keys(tagList)[0]].map((item) => {
    return {
      name: item.name,
      count: 0,
      used: 0
    }
  })

  mostUsed = mostUsed.slice(0, 5)

  Object.keys(tagList).forEach((appId) => {
    tagList[appId].forEach((subItem, index) => {
      if (index > 5) {
        return
      }

      let itemFound = mostUsed.some((mostUsedItem) => {
        if (mostUsedItem.name == subItem.name) {
          mostUsedItem.count += subItem.count
          mostUsedItem.used++
          return true
        }

        return false
      })

      if (!itemFound) {
        mostUsed.push({
          name: subItem.name,
          count: subItem.count,
          used: 1
        })
      }
    })
  })

  mostUsed.sort((a, b) => b.used - a.used)

  return mostUsed.slice(0, 5)
}

const filterTags = (tagList, filterArray) => {
  let filteredTagList = {}

  Object.keys(tagList).forEach((appId) => {
    filteredTagList[appId] = tagList[appId].filter((subItem) => {
      return !filterArray.includes(subItem.name)
    })
  })

  return filteredTagList
}

console.log('Querying tags')
async.reduce(appIdList[applicationName], {}, fetchTagByAppId, (err, result) => {
  if (err) {
    console.log(err)
  } else {
    let filteredResults = filterTags(result, poisonTagList)
    let filteredNoWeightLessResults = filterTags(result, noWeightTagList)
    console.log('Sorting filtered tags...')
    console.log({
      common: commonTags(filteredNoWeightLessResults),
      mostUsedTagsTop5: mostUsedTagsTop5(filteredNoWeightLessResults),
      mostUsedTags: mostUsedTags(filteredResults)
    })
  }
})
