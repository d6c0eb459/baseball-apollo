# Baseball GraphQL

A simple Apollo/Node.js GraphQL interface to the [Baseball Stats DB](https://github.com/rippinrobr/baseball-stats-db).

Uses data loaders to work around then n+1 problem.

## Installation

The baseball database can be downloaded using the following sequence:

```
wget -qO- "https://github.com/rippinrobr/baseball-stats-db/releases/download/2018.02/baseballdatabank-2019-02-18-sqlite.tgz" | tar xvz
cat baseballdatabank-2019-02-18-sqlite.sql | sqlite3 database.sqlite
```

## Usage

Run Jest tests with: `npm run test`

Run linting with: `npm run lint`

Start the server with: `npm start`

## Examples

### Search for players

Query
```graphql
{
  players(firstName: "Mike", lastName: "Tr") {
    playerId
    profile {
      name
      year
    }
  }
}
```

Response
```json
{
  "data": {
    "players": [
      {
        "playerId": "treshmi01",
        "profile": {
          "name": "Mike Tresh",
          "year": 1914
        }
      },
      {
        "playerId": "trombmi01",
        "profile": {
          "name": "Mike Trombley",
          "year": 1967
        }
      },
      {
        "playerId": "trostmi01",
        "profile": {
          "name": "Mike Trost",
          "year": 1866
        }
      },
      {
        "playerId": "troutmi01",
        "profile": {
          "name": "Mike Trout",
          "year": 1991
        }
      },
      {
        "playerId": "trujimi01",
        "profile": {
          "name": "Mike Trujillo",
          "year": 1960
        }
      }
    ]
  }
}
```

### Query a single player

Query
```graphql
{
  player(id: "troutmi01") {
    profile {
      name
    }
    stats {
      hits
      atBats
      homeRuns
      battingAverage
    }
  }
}
```

Response
```json
{
  "data": {
    "player": {
      "profile": {
        "name": "Mike Trout",
        "country": "USA"
      },
      "stats": {
        "hits": 1187,
        "atBats": 3870,
        "homeRuns": 240,
        "battingAverage": 0.307
      }
    }
  }
}
```

### Create a new lineup

Query
```graphql
mutation {
  lineup(centerField: "Mike Trout") {
    lineupId
    centerField {
      profile {
        name
      }
      stats {
        hits
        homeRuns
        atBats
      }
    }
  }
}
```

Response
```json
{
  "data": {
    "lineup": {
      "lineupId": 1,
      "centerField": {
        "profile": {
          "name": "Mike Trout"
        },
        "stats": {
          "homeRuns": 1187
        }
      }
    }
  }
}
```

### Edit an existing lineup

Query
```graphql
fragment PlayerParts on Player{
  profile {
    name
  }
  stats {
    homeRuns
  }
}

mutation {
  lineup(lineupId: 1, rightField: "judgeaa01", pitcher: "Shohei") {
    lineupId
    centerField {
      ...PlayerParts
    }
    rightField {
      ...PlayerParts
    }
    pitcher {
      ...PlayerParts
    }
  }
}
```

Response
```json
{
  "data": {
    "lineup": {
      "lineupId": 1,
      "centerField": {
        "profile": {
          "name": "Mike Trout"
        },
        "stats": {
          "homeRuns": 1187
        }
      },
      "rightField": {
        "profile": {
          "name": "Aaron Judge"
        },
        "stats": {
          "homeRuns": 284
        }
      },
      "pitcher": {
        "profile": {
          "name": "Shohei Ohtani"
        },
        "stats": {
          "homeRuns": 93
        }
      }
    }
  }
}
```

©️ Derek Cheung 2023
