/**
 * OfferBottomSheet.web.tsx
 * Web version — replaces @gorhom/bottom-sheet with a native HTML/CSS slide-up panel
 * but uses React Native Web components for layout and styling consistency.
 * Supports drag-to-expand/drag-to-close gestures.
 */
import React, { useEffect, useCallback, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Coffee, Tag, Calendar, Navigation } from "lucide-react-native";
import { registrarInteraccion } from "../lib/interactions";

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
  consumidorId?: string;
  ubicacion?: { lat: number; lng: number };
};

export function OfferBottomSheet({ commercePromos, onClose, consumidorId, ubicacion }: Props) {
  const isOpen = !!(commercePromos && commercePromos.length > 0);

  const [snapIndex, setSnapIndex] = useState(0); // 0 = 50%, 1 = 75%
  const [dragTranslateY, setDragTranslateY] = useState<number | null>(null);
  const [windowHeight, setWindowHeight] = useState(typeof window !== "undefined" ? window.innerHeight : 800);

  const isDragging = useRef(false);
  const startY = useRef(0);
  const startTranslateY = useRef(0);

  const panelHeight = windowHeight * 0.75;
  const snap0Position = panelHeight - (windowHeight * 0.50); // translated down by 25% of windowHeight (leaves 50% visible)
  const snap1Position = 0; // fully visible (leaves 75% visible)
  const closedPosition = panelHeight;

  // Track window resizing to keep heights accurate
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset snapIndex to 0 (50%) when a new sheet is opened
  useEffect(() => {
    if (isOpen) {
      setSnapIndex(0);
      setDragTranslateY(null);
    }
  }, [isOpen]);

  const handleComoLlegar = useCallback(() => {
    if (!commercePromos || commercePromos.length === 0) return;
    const promo = commercePromos[0];

    if (consumidorId) {
      commercePromos.forEach((p) => {
        registrarInteraccion({ ofertaId: p.id, tipo: "interaccion", consumidorId, ubicacion });
      });
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${promo.lat},${promo.lng}`;
    Linking.openURL(url).catch((err) => console.warn("Error abriendo mapa:", err));
  }, [commercePromos, consumidorId, ubicacion]);

  // Register views when opened
  useEffect(() => {
    if (commercePromos && commercePromos.length > 0 && consumidorId) {
      commercePromos.forEach((promo) => {
        registrarInteraccion({ ofertaId: promo.id, tipo: "vista", consumidorId, ubicacion });
      });
    }
  }, [commercePromos]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleStart = (clientY: number) => {
    isDragging.current = true;
    startY.current = clientY;
    const initialTranslate = snapIndex === 0 ? snap0Position : snap1Position;
    startTranslateY.current = initialTranslate;
    setDragTranslateY(initialTranslate);
  };

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging.current) return;
    const dy = clientY - startY.current;
    let nextTranslate = startTranslateY.current + dy;

    // Clamp between snap1Position (0) and closedPosition (panelHeight)
    if (nextTranslate < 0) nextTranslate = 0;
    if (nextTranslate > panelHeight) nextTranslate = panelHeight;

    setDragTranslateY(nextTranslate);
  }, [panelHeight]);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const currentVal = dragTranslateY ?? (snapIndex === 0 ? snap0Position : snap1Position);
    setDragTranslateY(null);

    // Snaps distances
    const distTo1 = Math.abs(currentVal - snap1Position);
    const distTo0 = Math.abs(currentVal - snap0Position);
    const distToClosed = Math.abs(currentVal - closedPosition);

    // Snap threshold for closing
    const dragDownThreshold = snap0Position + (closedPosition - snap0Position) * 0.35;

    if (currentVal > dragDownThreshold || distToClosed < distTo0) {
      onClose();
    } else if (distTo1 < distTo0) {
      setSnapIndex(1);
    } else {
      setSnapIndex(0);
    }
  }, [dragTranslateY, snapIndex, snap0Position, snap1Position, closedPosition, onClose]);

  // Dynamically attach move & end listeners to window
  useEffect(() => {
    if (dragTranslateY === null) return;

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientY);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientY);
    };

    const onTouchEnd = () => {
      handleEnd();
    };

    const onMouseUp = () => {
      handleEnd();
    };

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragTranslateY, handleMove, handleEnd]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 998,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Slide-up Panel */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: 600,
          margin: "0 auto",
          background: "#fff",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -4px 30px rgba(0,0,0,0.15)",
          zIndex: 999,
          height: `${panelHeight}px`,
          transform: `translateY(${!isOpen
              ? closedPosition
              : dragTranslateY !== null
                ? dragTranslateY
                : snapIndex === 0
                  ? snap0Position
                  : snap1Position
            }px)`,
          transition: dragTranslateY !== null ? "none" : "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          overflowY: "auto",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          touchAction: dragTranslateY !== null ? "none" : "auto",
        }}
      >
        {/* Grabbable Top Section */}
        <div
          onMouseDown={(e) => handleStart(e.clientY)}
          onTouchStart={(e) => {
            if (e.touches.length > 0) {
              handleStart(e.touches[0].clientY);
            }
          }}
          style={{
            cursor: "ns-resize",
            userSelect: "none",
            touchAction: "none",
          }}
        >
          {/* Drag handle */}
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "#ddd" }} />
          </div>

          {isOpen && commercePromos && (
            <View style={[styles.header, { paddingHorizontal: 20, marginBottom: 8 }]}>
              <View style={styles.iconContainer}>
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
            </View>
          )}
        </div>

        {isOpen && commercePromos && (
          <View style={styles.contentContainer}>
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
            <TouchableOpacity style={styles.ctaButton} onPress={handleComoLlegar}>
              <Navigation size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.ctaText}>Cómo llegar</Text>
            </TouchableOpacity>
          </View>
        )}
      </div>
    </>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ff6b00", // Saley Orange
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
    color: "#003366", // Dark Blue
  },
  commerceAddress: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },
  section: {
    flexDirection: "row",
    marginBottom: 4,
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
