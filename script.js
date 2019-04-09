$(document).ready(function () {
  var airportUrl = "database/Airports.json";
  var flightURL = "database/Flights.json";
  // var cityURL = "database/Cities.json";

  require([
    'Canvas-Flowmap-Layer/CanvasFlowmapLayer',
    'esri/Graphic',
    'esri/Map',
    'esri/views/MapView',
    "esri/layers/TileLayer",
    'dojo/domReady!'
  ], function (
    CanvasFlowmapLayer,
    Graphic,
    EsriMap,
    MapView,
    TileLayer
  ) {

      // var map = new Map({
      //     basemap: "dark-gray-vector"
      // });
      // // 在页面中呈现地图
      // var view = new MapView({
      //     container: "viewDiv",  // html dom元素id，用来作为地图视图容器
      //     map: map,               // 地图对象
      //     zoom: 4,  // Sets zoom level based on level of detail (LOD)
      //     center: [-95.049, 38.485]  // Sets center point of view using longitude,latitude
      // });

      // var layer1 = new TileLayer({
      //   url: "https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer"
      // });

      var view = new MapView({
        container: 'mapViewDiv',
        map: new EsriMap({
          // use a standard Web Mercator map projection basemap
          basemap: 'streets'
          // layers: [layer1]

        }),
        ui: {
          components: ['zoom', 'attribution', 'compass']
        },
        zoom: 4,  // Sets zoom level based on level of detail (LOD)
        center: [-95.049, 38.485]
      });


      view.when(function () {
        $("#loading").fadeOut();
        $("#detail").html('Please choose departure and destination.<br />请选择出发和到达地点。');

        // here we use Papa Parse to load and read the CSV data
        // we could have also used another library like D3js to do the same
        Papa.parse('database/flowmap.csv', {
          download: true,
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: handleCsvParsingComplete
        });
      });

      function handleCsvParsingComplete(results) {
        var graphicsFromCsvRows = results.data.map(function (datum) {
          return new Graphic({
            geometry: {
              type: 'point',
              longitude: datum.s_lon,
              latitude: datum.s_lat
            },
            attributes: datum
          });
        });

        var canvasFlowmapLayer = new CanvasFlowmapLayer({
          // array of Graphics
          graphics: graphicsFromCsvRows,

          // information about the uniqe origin-destinatino fields and geometries
          originAndDestinationFieldIds: {
            originUniqueIdField: 's_city_id',
            originGeometry: {
              x: 's_lon',
              y: 's_lat',
              spatialReference: {
                wkid: 4326
              }
            },
            destinationUniqueIdField: 'e_city_id',
            destinationGeometry: {
              x: 'e_lon',
              y: 'e_lat',
              spatialReference: {
                wkid: 4326
              }
            }
          }
        });

        view.map.layers.add(canvasFlowmapLayer);
        view.whenLayerView(canvasFlowmapLayer).then(function (canvasFlowmapLayerView) {
          canvasFlowmapLayerView.selectGraphicsForPathDisplayById('s_city_id', 1, true, 'SELECTION_NEW');
          for (i = 2; i < 52; i++) {
            canvasFlowmapLayerView.selectGraphicsForPathDisplayById('s_city_id', i, true, 'SELECTION_ADD');
          };



          $('#bt2').click(function () {
            if ($('#departure').find(':selected').html() == 'IAH' || $('#destination').find(':selected').html() == 'IAH') {
              alert('There is no flight connected to IAH in the database.');
            } else if ($('#departure').find(':selected').html() == $('#destination').find(':selected').html()) {
              alert('The departure airport matches the destination.')
            } else {
              var startcode = $('#departure').find(':selected').html();
              var endcode = $('#destination').find(':selected').html();
              var shortestPath = findShortestFlight(startcode, endcode)[0];
              var shortesttime = findShortestFlight(startcode, endcode)[1];
              var hours = parseInt(shortesttime / 1000 / 60 / 60);
              var mins = shortesttime / 1000 / 60 % 60;
              var activelist = [];
              for (i in shortestPath) {
                $.getJSON(flightURL, function (flights) {
                  $.each(flights, function (index, value) {
                    if (value.Code == shortestPath[i]) {
                      activelist.push(index + 1);
                    }
                  })
                })
              }
              for (j in activelist) {
                if (j == 0) {
                  canvasFlowmapLayerView.selectGraphicsForPathDisplayById('s_city_id', activelist[j], true, 'SELECTION_NEW');
                } else {
                  canvasFlowmapLayerView.selectGraphicsForPathDisplayById('s_city_id', activelist[j], true, 'SELECTION_ADD');
                }
              }
              $('#detail').html('从' + getCity(startcode) + '(' + startcode + ')' + '出发，到' + getCity(endcode) + '(' + endcode + ')' + '的最快路线：<br>')
              $('#detail').append('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + '乘坐航班顺序：')
              for (i in shortestPath) {
                $('#detail').append(shortestPath[i]);
                if (i + 1 < shortestPath.length) {
                  $('#detail').append('、')
                }
              }
              $('#detail').append('<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;共用时' + hours + '小时' + mins + '分钟')
            }
          });

          $('#bt3').click(function () {
            if ($('#departure').find(':selected').html() == 'IAH' || $('#destination').find(':selected').html() == 'IAH') {
              alert('There is no flight connected to IAH in the database.');
            } else if ($('#departure').find(':selected').html() == $('#destination').find(':selected').html()) {
              alert('The departure airport matches the destination.')
            } else {
              var startcode = $('#departure').find(':selected').html();
              var endcode = $('#destination').find(':selected').html();
              var paths = flights_list(startcode, endcode);
              var times = pathtime(startcode, endcode);
              console.log(times);
              var activelist = [];
              for (i in paths) {
                var path = paths[i];
                for (j in path) {
                  $.getJSON(flightURL, function (flights) {
                    $.each(flights, function (index, value) {
                      if (value.Code == path[j]) {
                        activelist.push(index + 1);
                      }
                    })
                  })
                }
              }

              for (k in activelist) {
                if (k == 0) {
                  canvasFlowmapLayerView.selectGraphicsForPathDisplayById('s_city_id', activelist[k], true, 'SELECTION_NEW');
                } else {
                  canvasFlowmapLayerView.selectGraphicsForPathDisplayById('s_city_id', activelist[k], true, 'SELECTION_ADD');
                }
              }
              $('#detail').html('从' + getCity(startcode) + '(' + startcode + ')' + '出发，到' + getCity(endcode) + '(' + endcode + ')' + '共有' + paths.length + '条路线：<br>')
              $('#detail').append('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + '乘坐航班顺序：<br>')
              var mapKeys = times.keys();
              var mapValues = times.values();
              for (i = 0; i < times.size; i++) {
                var index = parseInt(i) + parseInt(1);
                var path = mapKeys.next().value;
                var time = mapValues.next().value;
                var hours = parseInt(time / 1000 / 60 / 60);
                var mins = time / 1000 / 60 % 60;
                $('#detail').append('第' + index + '条路线乘坐航班顺序：' + path + '，共用时' + hours + '小时' + mins + '分钟<br>');
              }
            }
          });

          $('#bt4').click(function () {
            view.zoom = 4;
            view.center = [-95.049, 38.485];
            canvasFlowmapLayerView.selectGraphicsForPathDisplayById('s_city_id', 1, true, 'SELECTION_NEW');
            for (i = 2; i < 52; i++) {
              canvasFlowmapLayerView.selectGraphicsForPathDisplayById('s_city_id', i, true, 'SELECTION_ADD');
            };
            $('#detail').html('Please choose departure and destination.<br />请选择出发和到达地点。')
          });

        });
      }

      $.getJSON(airportUrl, function (airports) {
        var htmlContant = ""; // store the options
        var pointList = [];   // store the coordination of airports
        for (var i = 0; i < airports.length; i++) {
          var option = "<option>";
          option += airports[i].Code;
          option += "</option>";
          htmlContant += option;
          pointList.push([-airports[i].Long, +airports[i].Lat]);
        }
        $('#departure').append(htmlContant);
        $('#destination').append(htmlContant);
        //set the default value for the selectors
        var seaOption = $("#departure option:contains('SEA')");
        var miaOption = $("#destination option:contains('MIA')");
        seaOption[0].selected = "selected";
        miaOption[0].selected = "selected";

      });


    });


  // function of reverse direction
  $('#bt1').click(function () {
    var temp = $('#departure').find(':selected').html();
    $('#departure').val($('#destination').find(':selected').html());
    $('#destination').val(temp);
  });

  // $('#bt2').click(function () {
  //   if ($('#departure').find(':selected').html() == 'IAH' || $('#destination').find(':selected').html() == 'IAH') {
  //     alert('There is no flight connected to IAH in the database.');
  //   } else if ($('#departure').find(':selected').html() == $('#destination').find(':selected').html()) {
  //     alert('The departure airport matches the destination.')
  //   } else {
  //     canvasFlowmapLayerView.selectGraphicsForPathDisplayById('s_city_id', 15, true, 'SELECTION_NEW');
  //     canvasFlowmapLayerView.selectGraphicsForPathDisplayById('s_city_id', 30, true, 'SELECTION_ADD');
  //   }
  // });



})

