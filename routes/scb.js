var express = require('express');
var router = express.Router();
var fetch = require('node-fetch');
var axios = require('axios');

/* GET users listing. */
router.get('/', function (req, res, next) {
    fetch("http://api.scb.se/OV0104/v1/doris/sv/ssd/BE/BE0101/BE0101A/BefolkningNy",
        {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify(
                {
                    query: [
                        {
                            code: "ContentsCode",
                            selection: {
                                filter: "item",
                                values: [
                                    "BE0101N1"
                                ]
                            }
                        },
                        {
                            code: "Tid",
                            selection: {
                                filter: "item",
                                values: [
                                    "2000",
                                    "2001",
                                    "2002",
                                    "2003",
                                    "2011",
                                    "2016",
                                    "2017"
                                ]
                            }
                        }
                    ],
                    response: {
                        "format": "json"
                    }
                }
            )
        })
        .then(resp => {
            return resp.buffer();
        })
        .then(buffer => {
            resJson = JSON.parse(buffer.slice(3, buffer.length).toString());
            res.send(resJson);
        })
        .catch(error => console.error('Error:', error))
});

/* POST get region from string */
router.post('/region', function (req, res, next) {
    /* http://api.scb.se/OV0104/v1/doris/sv/ssd/BE/BE0101/BE0101A/BefolkningNy */
    var city, county;

    req.body.data.results.forEach((address) => {
      address.address_components.forEach((ac) => {
        ac.types.forEach((type) => {
          if (type === "postal_town") {
            city = ac.long_name;
          } else if (type === "administrative_area_level_1") {
            county = ac.long_name;
          }
        });
      });
    });

    // VARNING: Fulhax!
    if (city === "Gothenburg") {
      city = "Göteborg";
    }

    var end = county.search(' County'); 
    if (end >= 0) {
      county = county.substr(0, end);
    }

    end = county.search(' län'); 
    if (end >= 0) {
      county = county.substr(0, end);
    }

    /*
    var city = req.body.data.results[2].address_components[1].long_name;
    var county = req.body.data.results[2].address_components[2].long_name.split(" ")[0];
    */
    console.log(city);
    console.log(county);

    fetch("http://api.scb.se/OV0104/v1/doris/sv/ssd/BE/BE0101/BE0101A/BefolkningNy",
        {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "GET"
        })
        .then(resp => resp.json())
        .then(json => {
            var values = json.variables[0].values;
            var valueText = json.variables[0].valueTexts;

            var testArr = values.map(function (x, i) {
                return { "name": valueText[i], "id": x }
            }.bind(this));
            
            var cityId;
            var countyId;
            var i;
            for(i = 0; i < values.length; i++) {
                if(valueText[i] === city) {
                    cityId = values[i];
                }

                if(valueText[i] === county + " län") {
                    countyId = values[i];
                }
            }

            console.log("cityid=", cityId, " countyId=", countyId);

            res.send({
                "city": city,
                "cityId": cityId,
                "county": county,
                "countyId": countyId
            });
        });
});

router.get('/folkmangdTatort', function (req, res, next) {
  axios.post('http://api.scb.se/OV0104/v1/doris/sv/ssd/START/BE/BE0101/BE0101A/FolkmangdTatort', {
    "query": [
      {
        "code": "Region",
        "selection": {
          "filter": "agg:Blekinge",
          "values": [
            "T2680"
          ]
        }
      }
    ],
    "response": {
      "format": "json"
    }
  }).then(result => {
    var buffer = new Buffer(result.data);
    var data = JSON.parse(buffer.slice(3, buffer.length).toString());
    res.send(data);
  }).catch(err => {
    console.error('Error', err);
    res.sendStatus(500);
  });
});

router.get('/population', function (req, res, next) {
  var cityId = req.query.cityId;
  console.log('cityId', cityId);
  axios.post('http://api.scb.se/OV0104/v1/doris/sv/ssd/START/BE/BE0101/BE0101A/BefolkningNy', {
    "query": [
      {
        "code": "Region",
        "selection": {
          "filter": "vs:RegionKommun07",
          "values": [
            cityId
          ]
        }
      },
      {
        "code": "ContentsCode",
        "selection": {
          "filter": "item",
          "values": [
            "BE0101N1"
          ]
        }
      }
    ],
    "response": {
      "format": "json"
    }
  }).then(result => {
    var buffer = new Buffer(result.data);
    var data = JSON.parse(buffer.slice(3, buffer.length).toString());
    res.send(data);
  }).catch(err => {
    console.error('Error', err);
    res.sendStatus(500);
  });
});

router.get('/party', function (req, res, next) {
  var cityId = req.query.cityId;
  console.log('cityId', cityId);
  axios.post('http://api.scb.se/OV0104/v1/doris/sv/ssd/START/ME/ME0104/ME0104C/ME0104T3', {
  "query": [
    {
      "code": "Region",
      "selection": {
        "filter": "vs:RegionKommun07+BaraEjAggr",
        "values": [
          cityId
        ]
      }
    },
    {
      "code": "Partimm",
      "selection": {
        "filter": "item",
        "values": [
          "M",
          "C",
          "FP",
          "KD",
          "MP",
          "S",
          "V",
          "SD",
          "ÖVRIGA"
        ]
      }
    },
    {
      "code": "ContentsCode",
      "selection": {
        "filter": "item",
        "values": [
          "ME0104B7"
        ]
      }
    },
    {
      "code": "Tid",
      "selection": {
        "filter": "item",
        "values": [
          "2014"
        ]
      }
    }
  ],
  "response": {
    "format": "json"
  }
}).then(result => {
    var buffer = new Buffer(result.data);
    var data = JSON.parse(buffer.slice(3, buffer.length).toString());
    res.send(data);
  }).catch(err => {
    console.error('Error', err);
    res.sendStatus(500);
  });
});

router.get('/scientists', function (req, res, next) {
  var cityId = req.query.cityId;
  console.log('cityId', cityId);
  axios.post('http://api.scb.se/OV0104/v1/doris/sv/ssd/START/UF/UF0506/Utbildning', {
    "query": [
      {
        "code": "Region",
        "selection": {
          "filter": "vs:RegionKommun07",
          "values": [
            cityId
          ]
        }
      },
      {
        "code": "Alder",
        "selection": {
          "filter": "vs:ÅlderTotB",
          "values": [
            "tot16-74"
          ]
        }
      },
      {
        "code": "UtbildningsNiva",
        "selection": {
          "filter": "item",
          "values": [
            "7"
          ]
        }
      },
      {
        "code": "Tid",
        "selection": {
          "filter": "item",
          "values": [
            "2016"
          ]
        }
      }
    ],
    "response": {
      "format": "json"
    }
}).then(result => {
    var buffer = new Buffer(result.data);
    var data = JSON.parse(buffer.slice(3, buffer.length).toString());
    res.send(data);
  }).catch(err => {
    console.error('Error', err);
    res.sendStatus(500);
  });
});

router.post('/chicken', function (req, res, next) {

  console.log(req.body);
  fetch("http://api.scb.se/OV0104/v1/doris/sv/ssd/START/JO/JO0103/HusdjurL",
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify(
        {
          "query": [
            {
              "code": "Region",
              "selection": {
                "filter": "vs:Region99LanGU",
                "values": [
                  req.body.countyId
                ]
              }
            },
            {
              "code": "Djurslag",
              "selection": {
                "filter": "item",
                "values": [
                  "65"
                ]
              }
            }
          ],
          "response": {
            "format": "json"
          }
        })
    })
    .then(resp => {
      return resp.buffer();
    })
    .then(buffer => {
      resJson = JSON.parse(buffer.slice(3, buffer.length).toString());
      res.send(resJson);
    })
    .catch(error => console.error('Error:', error))
});

module.exports = router;
