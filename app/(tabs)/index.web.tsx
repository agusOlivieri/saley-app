/**
 * app/(tabs)/index.web.tsx
 * Versión web de la pantalla principal con mapa Mapbox GL JS via react-map-gl.
 * Usa la browser Geolocation API en lugar de expo-location.
 */
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import { Bell, MapPin, SlidersHorizontal, ChevronDown, Coffee, Pizza, Dumbbell, ShoppingBag } from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import { OfferBottomSheet, Promo } from "../../components/OfferBottomSheet";
import { getDistanceInMeters, formatDistance } from "../../lib/distance";
import { useAuth } from "../../lib/AuthContext";

// Inject mapbox-gl CSS dynamically (Metro bundler doesn't handle CSS imports natively)
if (typeof document !== "undefined" && !document.getElementById("mapbox-gl-css")) {
  const link = document.createElement("link");
  link.id = "mapbox-gl-css";
  link.rel = "stylesheet";
  link.href = "https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.css";
  document.head.appendChild(link);
}


const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN!;

type UserLocation = { latitude: number; longitude: number };

export default function ExploreScreen() {
  const { user } = useAuth();
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [cityName, setCityName] = useState<string>("Cargando...");
  const [promos, setPromos] = useState<Promo[]>([]);
  const [selectedCommercePromos, setSelectedCommercePromos] = useState<Promo[] | null>(null);
  const [viewState, setViewState] = useState({
    longitude: -58.45,
    latitude: -34.58,
    zoom: 13,
  });

  // Obtener ubicación del browser
  useEffect(() => {
    if (!navigator.geolocation) {
      setCityName("Tu Ubicación");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setViewState((v) => ({ ...v, latitude, longitude, zoom: 14 }));

        // Reverse geocode con Nominatim (libre)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "Tu Ubicación";
          setCityName(city);
        } catch {
          setCityName("Tu Ubicación");
        }
      },
      () => setCityName("Tu Ubicación"),
      { enableHighAccuracy: false, timeout: 10000 }
    );

    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    const { data, error } = await supabase.from("vw_promos_activas").select("*");
    if (error) {
      console.error("Error fetching promos:", error);
    } else {
      setPromos(data as unknown as Promo[]);
    }
  };

  // Oferta más cercana para el banner
  const nearestPromo = useMemo(() => {
    if (!location || promos.length === 0) return null;
    const { latitude, longitude } = location;
    let closest: { promo: Promo; distance: number } | null = null;
    for (const promo of promos) {
      if (typeof promo.lat !== "number" || typeof promo.lng !== "number") continue;
      const dist = getDistanceInMeters(latitude, longitude, promo.lat, promo.lng);
      if (closest === null || dist < closest.distance) {
        closest = { promo, distance: dist };
      }
    }
    return closest;
  }, [location, promos]);

  const getCategoryIcon = (category: string): React.ReactNode => {
    const color = "#ff6b00";
    switch (category?.toLowerCase()) {
      case "café":
      case "cafe":
        return <Coffee size={14} color={color} />;
      case "pizza":
      case "pizzería":
        return <Pizza size={14} color={color} />;
      case "gimnasio":
      case "gym":
        return <Dumbbell size={14} color={color} />;
      case "moda":
      case "ropa":
        return <ShoppingBag size={14} color={color} />;
      default:
        return <MapPin size={14} color={color} />;
    }
  };

  // Agrupar promos por comercio
  const byCommerce = useMemo(() => {
    return Object.values(
      promos.reduce((acc, promo) => {
        if (!acc[promo.comercio_id]) acc[promo.comercio_id] = [];
        acc[promo.comercio_id].push(promo);
        return acc;
      }, {} as Record<string, Promo[]>)
    );
  }, [promos]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoText}>Saley</Text>
        </View>
        <View style={styles.locationSelector}>
          <MapPin size={16} color="#333" />
          <Text style={styles.locationText}>{cityName}</Text>
          <ChevronDown size={16} color="#333" />
        </View>
        <View style={styles.headerRight}>
          <Bell size={24} color="#003366" />
        </View>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIconContainer}>
          <MapPin size={20} color="#fff" />
        </View>
        {nearestPromo ? (
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerText} numberOfLines={1}>
              {nearestPromo.promo.nombre_comercial} · {formatDistance(nearestPromo.distance)}
            </Text>
            <Text style={styles.bannerSubtext} numberOfLines={1}>
              {nearestPromo.promo.titulo}
            </Text>
          </View>
        ) : (
          <Text style={styles.bannerText}>Explorá ofertas cerca tuyo</Text>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterText}>Categoría</Text>
          <ChevronDown size={14} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <MapPin size={14} color="#666" />
          <Text style={styles.filterText}>Distancia: 500m</Text>
          <ChevronDown size={14} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsBtn}>
          <SlidersHorizontal size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
        >
          <NavigationControl position="top-right" />

          {/* User location marker */}
          {location && (
            <Marker longitude={location.longitude} latitude={location.latitude} anchor="bottom">
              <div style={markerStyles.userContainer}>
                <div style={markerStyles.userLabel}>
                  <span style={markerStyles.userLabelText}>Vos</span>
                </div>
                <div style={markerStyles.userDotWrapper}>
                  <div style={markerStyles.userDot} />
                </div>
              </div>
            </Marker>
          )}

          {/* Commerce markers */}
          {byCommerce.map((commercePromos) => {
            const promo = commercePromos[0];
            if (typeof promo.lng !== "number" || typeof promo.lat !== "number") return null;

            return (
              <Marker
                key={promo.comercio_id}
                longitude={promo.lng}
                latitude={promo.lat}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedCommercePromos(commercePromos);
                }}
              >
                <div style={markerStyles.promoContainer}>
                  <div style={markerStyles.promoLabel}>
                    <span style={markerStyles.promoTitle}>{promo.nombre_comercial}</span>
                    <span style={markerStyles.promoSubtitle}>
                      {promo.comercio_categoria} • {commercePromos.length} promo
                      {commercePromos.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div style={markerStyles.promoIcon}>
                    {getCategoryIcon(promo.comercio_categoria || "")}
                  </div>
                </div>
              </Marker>
            );
          })}
        </Map>
      </View>

      {/* Bottom Sheet (web version) */}
      <OfferBottomSheet
        commercePromos={selectedCommercePromos}
        onClose={() => setSelectedCommercePromos(null)}
        consumidorId={user?.id}
        ubicacion={location ? { lat: location.latitude, lng: location.longitude } : undefined}
      />
    </View>
  );
}

// React Native styles (for the non-map UI)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: "#fff",
    zIndex: 10,
  },
  headerLeft: { flex: 1 },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003366",
  },
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 2,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  headerRight: { flex: 1, alignItems: "flex-end" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#003366",
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  bannerIconContainer: {
    backgroundColor: "#ff6b00",
    borderRadius: 20,
    padding: 6,
    marginRight: 12,
  },
  bannerTextContainer: { flex: 1 },
  bannerText: { color: "#fff", fontSize: 16, fontWeight: "bold", flexShrink: 1 },
  bannerSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
    flexShrink: 1,
  },
  filtersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "#f5f5f5",
    zIndex: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 4,
  },
  filterText: { fontSize: 12, color: "#333", marginRight: 4 },
  settingsBtn: {
    backgroundColor: "#003366",
    padding: 8,
    borderRadius: 20,
    marginLeft: "auto",
  },
  mapContainer: { flex: 1 },
});

// CSS-in-JS styles for HTML elements inside react-map-gl markers
const markerStyles: Record<string, React.CSSProperties> = {
  userContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "default",
  },
  userLabel: {
    backgroundColor: "#003366",
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 4,
    paddingBottom: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  userLabelText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  userDotWrapper: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    backgroundColor: "rgba(0,102,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  userDot: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    backgroundColor: "#0066ff",
    border: "2px solid #fff",
  },
  promoContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    width: 120,
  },
  promoLabel: {
    backgroundColor: "#fff",
    padding: 6,
    borderRadius: 8,
    marginBottom: 4,
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    width: "100%",
  },
  promoTitle: {
    display: "block",
    fontSize: 11,
    fontWeight: "bold",
    color: "#333",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  promoSubtitle: {
    display: "block",
    fontSize: 10,
    color: "#666",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  promoIcon: {
    backgroundColor: "#fff",
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    border: "2px solid #ff6b00",
  },
};
