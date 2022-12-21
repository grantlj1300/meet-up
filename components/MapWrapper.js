import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/MapWrapper.module.css";
import { Map, View, Feature, Overlay } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { fromLonLat, transformExtent } from "ol/proj";
import MapboxVector from "ol/layer/MapboxVector";
import { Point } from "ol/geom";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import EventPreview from "./EventPreview";

export default function MapWrapper({ regionView, events, setShowSearch }) {
    const [map, setMap] = useState();
    const [currentEvent, setCurrentEvent] = useState();
    const [markerSource, setMarkerSource] = useState();
    const overlaySource = useRef();
    const mapElement = useRef();
    const mapRef = useRef();

    useEffect(() => {
        if (!mapRef.current) {
            const markers = new VectorLayer({
                source: new VectorSource({
                    features: [],
                }),
                style: new Style({
                    image: new Icon({
                        src: "https://docs.maptiler.com/openlayers/default-marker/marker-icon.png",
                        anchor: [0.5, 1],
                    }),
                }),
            });
            setMarkerSource(markers.getSource());
            const initialMap = new Map({
                target: mapElement.current,
                layers: [
                    new MapboxVector({
                        styleUrl: "mapbox://styles/mapbox/streets-v12",
                        accessToken:
                            "pk.eyJ1IjoiZ3JhbnRsajEzMDAiLCJhIjoiY2xic2ZmZXNsMDJlNDNvcGY5Z2x4aTlvdiJ9.qfeMh-gZ1kixcbZQNKI99w",
                    }),
                    markers,
                ],
                view: new View({
                    projection: "EPSG:3857",
                    center: [0, 0],
                    zoom: 2,
                }),
                controls: [],
            });
            if (regionView) {
                const extent = transformExtent(
                    [
                        regionView.minLon,
                        regionView.minLat,
                        regionView.maxLon,
                        regionView.maxLat,
                    ],
                    "EPSG:4326",
                    "EPSG:3857"
                );
                initialMap.getView().fit(extent);
            }
            const overlay = new Overlay({
                element: document.getElementById("popup"),
                positioning: "bottom-center",
                offset: [0, -50],
            });
            overlaySource.current = overlay;
            initialMap.addOverlay(overlay);
            initialMap.on("click", handleMapClick);
            initialMap.on("pointermove", handlePointerMove);
            mapRef.current = initialMap;
            setMap(initialMap);
        }
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (map && regionView) {
            const extent = transformExtent(
                [
                    regionView.minLon,
                    regionView.minLat,
                    regionView.maxLon,
                    regionView.maxLat,
                ],
                "EPSG:4326",
                "EPSG:3857"
            );
            map.getView().fit(extent, { duration: 2000 });
        }
        // eslint-disable-next-line
    }, [regionView]);

    useEffect(() => {
        if (map) {
            markerSource.clear();
            const features = events.map((event) => {
                const feature = new Feature({
                    geometry: new Point(fromLonLat([event.lon, event.lat])),
                    event: event,
                });
                feature.setId(event._id);
                return feature;
            });

            markerSource.addFeatures(features);
        }
        // eslint-disable-next-line
    }, [events]);

    function handlePointerMove(e) {
        const hovered = mapRef.current.forEachFeatureAtPixel(
            e.pixel,
            (feature) => {
                return feature;
            }
        );
        if (hovered instanceof Feature) {
            const coord = hovered.getGeometry().getCoordinates();
            let container = document.getElementById("popup");
            container.innerHTML = hovered.get("event").title;
            overlaySource.current.setPosition(coord);
        } else {
            overlaySource.current.setPosition(undefined);
        }
    }

    function handleMapClick(e) {
        const clicked = mapRef.current.forEachFeatureAtPixel(
            e.pixel,
            (feature) => {
                return feature;
            }
        );
        if (clicked instanceof Feature) {
            console.log(clicked.get("event"));
            setCurrentEvent(clicked.get("event"));
            setShowSearch(false);
        } else {
            setCurrentEvent(null);
            setShowSearch(true);
        }
    }

    return (
        <div ref={mapElement} className={styles.map}>
            <div id="popup" className={styles.popup}></div>
            <EventPreview event={currentEvent} setEvent={setCurrentEvent} />
        </div>
    );
}
