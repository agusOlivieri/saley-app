import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Heart, Navigation, Tag, Calendar, Coffee } from "lucide-react-native";

export type Promo = {
  id: string;
  comercio_id: string;
  titulo: string;
  descripcion: string;
  tipo_beneficio: string;
  fecha_inicio: string;
  fecha_fin: string;
  nombre_comercial: string;
  direccion_texto: string;
  comercio_categoria: string;
  lat: number;
  lng: number;
};

type Props = {
  commercePromos: Promo[] | null;
  onClose: () => void;
};

export function OfferBottomSheet({ commercePromos, onClose }: Props) {
  const bottomSheetRef = useRef<BottomSheet>(null);

  // variables
  const snapPoints = useMemo(() => ["50%", "75%"], []);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (commercePromos && commercePromos.length > 0) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [commercePromos]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onChange={handleSheetChanges}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      containerStyle={styles.sheetContainer}
    >
      <BottomSheetView style={styles.contentContainer}>
        {commercePromos && commercePromos.length > 0 ? (
          <>
            {/* Header: Commerce Info */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                {/* Simple local icon mapping logic placeholder */}
                <Coffee size={32} color="#fff" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.commerceName}>
                  {commercePromos[0].nombre_comercial || "Comercio"}
                </Text>
                <Text style={styles.commerceAddress}>
                  {commercePromos[0].direccion_texto || "Dirección no disponible"}
                </Text>
              </View>
              <TouchableOpacity style={styles.favoriteBtn}>
                <Heart size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Offer Details */}
            {commercePromos.map((promo, index) => (
              <View key={promo.id}>
                <View style={styles.section}>
                  <Tag size={20} color="#ff6b00" style={styles.sectionIcon} />
                  <View style={styles.sectionTextContent}>
                    <Text style={styles.sectionTitle}>{promo.titulo}</Text>
                    <Text style={styles.sectionSubtext}>{promo.descripcion}</Text>
                  </View>
                </View>

                {/* Validity */}
                <View style={styles.section}>
                  <Calendar size={18} color="#666" style={styles.sectionIcon} />
                  <View style={styles.sectionTextContent}>
                    <Text style={styles.sectionText}>
                      Válida hasta el {new Date(promo.fecha_fin).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {index < commercePromos.length - 1 && <View style={styles.divider} />}
              </View>
            ))}

            {/* CTA Button */}
            <TouchableOpacity style={styles.ctaButton}>
              <Navigation size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.ctaText}>Cómo llegar</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    zIndex: 999,
    elevation: 999,
  },
  bottomSheetBackground: {
    backgroundColor: "#fff",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  handleIndicator: {
    backgroundColor: "#ddd",
    width: 40,
    height: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ff6b00", // Naranja de Saley
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  commerceName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#003366", // Azul oscuro
  },
  commerceAddress: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  favoriteBtn: {
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },
  section: {
    flexDirection: "row",
    marginBottom: 4, // Was 16 but using divider
  },
  sectionIcon: {
    marginTop: 2,
    marginRight: 16,
  },
  sectionTextContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
    color: "#444",
  },
  sectionSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  ctaButton: {
    backgroundColor: "#ff6b00",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 15,
    marginBottom: 30,
  },
  ctaText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
