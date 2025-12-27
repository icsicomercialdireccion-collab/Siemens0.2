import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';


export const FormEditStyle = StyleSheet.create({
   container: {
       flex: 1,
       backgroundColor: '#f5f5f5',
     },
     header: {
       padding: 25,
       backgroundColor: COLORS.primary,
       borderBottomLeftRadius: 20,
       borderBottomRightRadius: 20,
       marginBottom: 20,
       position: 'relative',
     },
     backButton: {
       position: 'absolute',
       left: 20,
       top: 25,
       zIndex: 1,
       padding: 5,
     },
     title: {
       fontSize: 28,
       fontWeight: 'bold',
       color: '#fff',
       marginBottom: 5,
       textAlign: 'center',
     },
     subtitle: {
       fontSize: 16,
       color: 'rgba(255, 255, 255, 0.9)',
       textAlign: 'center',
     },
     form: {
       paddingHorizontal: 20,
     },
     imageSection: {
       marginBottom: 30,
     },
     infoSection: {
       marginBottom: 20,
     },
     sectionTitle: {
       fontSize: 18,
       fontWeight: 'bold',
       color: COLORS.text,
       marginBottom: 15,
       borderLeftWidth: 4,
       borderLeftColor: COLORS.primary,
       paddingLeft: 10,
     },
     imageContainer: {
       alignItems: 'center',
       marginBottom: 15,
     },
     selectedImageContainer: {
       position: 'relative',
       width: '100%',
       alignItems: 'center',
     },
     selectedImage: {
       width: '100%',
       height: 250,
       borderRadius: 15,
       marginBottom: 10,
     },
     removeImageButton: {
       position: 'absolute',
       top: 10,
       right: 10,
       backgroundColor: 'rgba(255, 255, 255, 0.8)',
       borderRadius: 15,
       padding: 5,
     },
     currentImageContainer: {
       width: '100%',
       alignItems: 'center',
     },
     currentImage: {
       width: '100%',
       height: 250,
       borderRadius: 15,
       marginBottom: 10,
     },
     noImageContainer: {
       width: '100%',
       height: 200,
       backgroundColor: '#f0f0f0',
       borderRadius: 15,
       justifyContent: 'center',
       alignItems: 'center',
       borderWidth: 2,
       borderColor: '#ddd',
       borderStyle: 'dashed',
     },
     noImageText: {
       marginTop: 10,
       color: '#999',
       fontSize: 16,
     },
     imageNote: {
       fontSize: 14,
       color: '#666',
       fontStyle: 'italic',
     },
     imageButtons: {
       flexDirection: 'row',
       gap: 10,
     },
     imageButton: {
       flex: 1,
       flexDirection: 'row',
       alignItems: 'center',
       justifyContent: 'center',
       paddingVertical: 12,
       borderRadius: 10,
       gap: 8,
     },
     galleryButton: {
       backgroundColor: '#6c757d',
     },
     cameraButton: {
       backgroundColor: '#4CAF50',
     },
     imageButtonText: {
       color: '#fff',
       fontWeight: '600',
       fontSize: 16,
     },
     inputGroup: {
       marginBottom: 20,
     },
     label: {
       fontSize: 16,
       fontWeight: '600',
       color: COLORS.text,
       marginBottom: 8,
     },
     required: {
       color: '#FF4444',
     },
     input: {
       backgroundColor: '#fff',
       padding: 15,
       borderRadius: 10,
       fontSize: 16,
       borderWidth: 1,
       borderColor: '#ddd',
     },
     textArea: {
       minHeight: 100,
       textAlignVertical: 'top',
     },
     pickerContainer: {
       backgroundColor: '#fff',
       borderRadius: 10,
       borderWidth: 1,
       borderColor: '#ddd',
       overflow: 'hidden',
     },
     picker: {
       height: 50,
     },
     actions: {
       flexDirection: 'row',
       gap: 15,
       marginTop: 30,
       marginBottom: 40,
     },
     button: {
       flex: 1,
       flexDirection: 'row',
       alignItems: 'center',
       justifyContent: 'center',
       paddingVertical: 15,
       borderRadius: 10,
     },
     cancelButton: {
       backgroundColor: '#f0f0f0',
       borderWidth: 1,
       borderColor: '#ddd',
     },
     saveButton: {
       backgroundColor: COLORS.primary,
     },
     buttonDisabled: {
       opacity: 0.6,
     },
     cancelButtonText: {
       fontSize: 16,
       fontWeight: '600',
       color: COLORS.text,
     },
     saveButtonText: {
       fontSize: 16,
       fontWeight: '600',
       color: '#fff',
     },
     uploadOverlay: {
       position: 'absolute',
       top: 0,
       left: 0,
       right: 0,
       bottom: 0,
       backgroundColor: 'rgba(0, 0, 0, 0.7)',
       justifyContent: 'center',
       alignItems: 'center',
       zIndex: 1000,
     },
     uploadText: {
       marginTop: 15,
       color: '#fff',
       fontSize: 16,
       fontWeight: '600',
     }, 

})