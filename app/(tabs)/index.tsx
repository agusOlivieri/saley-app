import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Mapbox from "@rnmapbox/maps";
import * as Location from "expo-location";
import { Bell, MapPin, SlidersHorizontal, ChevronDown, Coffee, Pizza, Dumbbell, ShoppingBag } from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import { OfferBottomSheet, Promo } from "../../components/OfferBottomSheet";
import { useProximityNotifications } from "../../lib/useProximityNotifications";
import { requestNotificationPermissions, registerPushToken } from "../../lib/notifications";
import { getDistanceInMeters, formatDistance } from "../../lib/distance";
import { useAuth } from "../../lib/AuthContext";

const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

// Configure Mapbox
Mapbox.setAccessToken(token!);

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string>("Cargando...");
  const [promos, setPromos] = useState<Promo[]>([]);
  const [selectedCommercePromos, setSelectedCommercePromos] = useState<Promo[] | null>(null);

  // Inicializa permisos de notificaciones y registra el push token del dispositivo
  useEffect(() => {
    (async () => {
      await requestNotificationPermissions();
      if (user?.id) {
        await registerPushToken(user.id);
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setCityName("Tu Ubicación");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode && reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const city = address.city || address.subregion || address.region || "Tu Ubicación";
          setCityName(city);
        } else {
          setCityName("Tu Ubicación");
        }
      } catch (geocodeError) {
        console.warn("Error al resolver la ciudad:", geocodeError);
        setCityName("Tu Ubicación");
      }
    })();

    fetchPromos();
  }, []);

  // Calcula la oferta más cercana al usuario para mostrar en el banner
  const nearestPromo = useMemo(() => {
    if (!location || promos.length === 0) return null;
    const { latitude, longitude } = location.coords;

    let closest: { promo: Promo; distance: number } | null = null;
    for (const promo of promos) {
      if (typeof promo.lat !== 'number' || typeof promo.lng !== 'number') continue;
      const dist = getDistanceInMeters(latitude, longitude, promo.lat, promo.lng);
      if (closest === null || dist < closest.distance) {
        closest = { promo, distance: dist };
      }
    }
    return closest;
  }, [location, promos]);

  // Monitorea la ubicación del usuario y dispara notificaciones de proximidad (200m)
  useProximityNotifications(promos, !!location);

  const fetchPromos = async () => {
    // Usamos la vista de base de datos que ya incluye lat y lng
    const { data, error } = await supabase
      .from("vw_promos_activas")
      .select("*");

    console.log("promos recibidos: ", data)

    if (error) {
      console.error("Error fetching promos:", error);
    } else {
      setPromos(data as unknown as Promo[]);
    }
  };

  const getCategoryIcon = (category: string): React.ReactNode => {
    const color = "#ff6b00";
    switch (category?.toLowerCase()) {
      case "café":
      case "cafe":
        return <Coffee size={16} color={color} />;
      case "pizza":
      case "pizzería":
        return <Pizza size={16} color={color} />;
      case "gimnasio":
      case "gym":
        return <Dumbbell size={16} color={color} />;
      case "moda":
      case "ropa":
        return <ShoppingBag size={16} color={color} />;
      default:
        return <MapPin size={16} color={color} />;
    }
  };


  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
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

      {/* Banner — muestra la oferta más cercana con distancia real */}
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
          <MapPin size={14} color="#666" style={{ marginRight: 4 }} />
          <Text style={styles.filterText}>Distancia: 500m</Text>
          <ChevronDown size={14} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsBtn}>
          <SlidersHorizontal size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <Mapbox.MapView style={styles.map} logoEnabled={false} attributionEnabled={false}>
          <Mapbox.Camera
            zoomLevel={14}
            centerCoordinate={
              location
                ? [location.coords.longitude, location.coords.latitude]
                : [-58.45, -34.58]
            }
          />
          {location && (
            <Mapbox.MarkerView
              id="userLocation"
              coordinate={[location.coords.longitude, location.coords.latitude]}
            >
              <View style={styles.userMarkerContainer}>
                <View style={styles.userMarkerLabel}>
                  <Text style={styles.userMarkerText}>Vos</Text>
                </View>
                <View style={styles.userMarkerDotWrapper}>
                  <View style={styles.userMarkerDot} />
                </View>
              </View>
            </Mapbox.MarkerView>
          )}

          {/* Agrupamos las promos por comercio para evitar superposición exacta de pines */}
          {Object.values(
            promos.reduce((acc, promo) => {
              if (!acc[promo.comercio_id]) acc[promo.comercio_id] = [];
              acc[promo.comercio_id].push(promo);
              return acc;
            }, {} as Record<string, Promo[]>)
          ).map((commercePromos) => {
            const promo = commercePromos[0]; // Usamos la info del comercio de la primera promo
            if (typeof promo.lng !== 'number' || typeof promo.lat !== 'number') return null;
            const coord: [number, number] = [promo.lng, promo.lat];

            return (
              <Mapbox.MarkerView
                key={promo.comercio_id}
                id={`comercio-${promo.comercio_id}`}
                coordinate={coord}
              >
                <TouchableOpacity
                  onPress={() => setSelectedCommercePromos(commercePromos)}
                  activeOpacity={0.8}
                >
                  <View style={styles.promoMarkerContainer}>
                    <View style={styles.promoMarkerLabel}>
                      <Text style={styles.promoMarkerTitle}>{promo.nombre_comercial}</Text>
                      <Text style={styles.promoMarkerSubtitle}>
                        {promo.comercio_categoria} • {commercePromos.length} promo{commercePromos.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={styles.promoMarkerIcon}>
                      {getCategoryIcon(promo.comercio_categoria || "")}
                    </View>
                  </View>
                </TouchableOpacity>
              </Mapbox.MarkerView>
            );
          })}
        </Mapbox.MapView>
      </View>

      {/* Bottom Sheet */}
      <OfferBottomSheet
        commercePromos={selectedCommercePromos}
        onClose={() => setSelectedCommercePromos(null)}
        consumidorId={user?.id}
        ubicacion={
          location
            ? { lat: location.coords.latitude, lng: location.coords.longitude }
            : undefined
        }
      />
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5ff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#ffffff0d",
    zIndex: 10,
  },
  headerLeft: {
    flex: 1,
  },
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
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
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
  bannerTextContainer: {
    flex: 1,
  },
  bannerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    flexShrink: 1,
  },
  bannerSubtext: {
    color: "rgba(255, 255, 255, 0.8)",
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
  },
  filterText: {
    fontSize: 12,
    color: "#333",
    marginRight: 4,
  },
  settingsBtn: {
    backgroundColor: "#003366",
    padding: 8,
    borderRadius: 20,
    marginLeft: "auto",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  userMarkerContainer: {
    alignItems: "center",
  },
  userMarkerLabel: {
    backgroundColor: "#003366",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  userMarkerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  userMarkerDotWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 102, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  userMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#0066ff",
    borderWidth: 2,
    borderColor: "#fff",
  },
  promoMarkerContainer: {
    alignItems: "center",
    width: 120, // To allow text to wrap or fit
  },
  promoMarkerLabel: {
    backgroundColor: "#fff",
    padding: 6,
    borderRadius: 8,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promoMarkerTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  promoMarkerSubtitle: {
    fontSize: 10,
    color: "#666",
  },
  promoMarkerIcon: {
    backgroundColor: "#fff",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#ff6b00",
  },
});
