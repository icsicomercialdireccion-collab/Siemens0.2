import { Dimensions, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

const { width } = Dimensions.get("window");


export const ListStyle = StyleSheet.create({
     listContainer: {
        padding: 2,
        paddingBottom: 100,
      },
      equipmentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginVertical: 1,
      },
      cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      },
      serialContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      },
      serialText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginLeft: 8,
      },
      statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
      },
      statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#495057',
      },
      cardBody: {
        marginBottom: 12,
      },
      infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
      },
      typeText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
      },
      observationsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        backgroundColor: '#f8f9fa',
        padding: 8,
        borderRadius: 6,
      },
      observationsText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 6,
        flex: 1,
        fontStyle: 'italic',
      },
      imageContainer: {
        position: 'relative',
        height: 120,
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 8,
      },
      equipmentImage: {
        width: '100%',
        height: '100%',
      },
      imageBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 4,
        borderRadius: 4,
      },
      noImageContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginTop: 8,
      },
      noImageText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
      },
      cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 12,
      },
      dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      dateText: {
        fontSize: 12,
        color: '#999',
        marginLeft: 4,
      },
      actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      actionButton: {
        padding: 8,
        marginLeft: 8,
      },
      deleteButton: {
        // Estilo específico para botón de eliminar
      },
      separator: {
        height: 12,
      },
      footer: {
        paddingVertical: 20,
        alignItems: 'center',
      },
      emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
      },
      emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
      },
      emptySubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
      },
})