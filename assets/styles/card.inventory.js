import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export  const cardStyle = StyleSheet.create({
    
    card: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: COLORS.text,
    marginBottom: 4,
  },
  creator: {
    fontSize: 14,
    color: COLORS.titleform,
    marginBottom: 12,
  },
  location: {
    fontSize: 16,
    color: COLORS.textContent,
    marginBottom: 8,
  },
  equipmentCount: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: 16,
  },
  detailsButton: {
    backgroundColor: COLORS.text,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  updatedAt: {
    fontSize: 12,
    color: '#8e8e93',
    alignSelf: 'flex-end',
    textAlign: 'right',
    width: 150
  },
  icon:{
    color: COLORS.primary,
    
  }
})

