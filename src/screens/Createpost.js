import {
  Text,
  View,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  PermissionsAndroid,
  Modal
} from 'react-native';
import React, { useState, useEffect } from 'react';
import COLORS from '../global/globalColors';
import * as Progress from 'react-native-progress';

import FIcon from 'react-native-vector-icons/Feather';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { getEncTokenAnyUserId, getEncUserId } from '../shared/encryption';
import AsyncStorage from '@react-native-community/async-storage';
import { useNavigation } from '@react-navigation/native';

const API_URL = process.env.API_URL || 'https://api.lykapp.com/lykjwt/index.php?/';
export const UPLOAD_IMG = `${API_URL}/Chatpost/uploadImage`;
export const UPLOAD_VIDEO = `https://video.lykapp.com:8090/pro/api/v1/index.php/uploadVideo`;
export const NEW_POST = `${API_URL}/Postchat/createNewPost`;
export const CREATE_NEW_POST_SHORT = "cetNwot";

export default function Createpost() {
  const navigation = useNavigation();
  const [user, setUser] = useState();
  const [post, setPost] = useState();
  const [progress, setProgress] = useState(0);
  useEffect(()=>{
    async function getUser(){
      let userDetails = await AsyncStorage.getItem('userId');
      userDetails = JSON.parse(userDetails);
      setUser(userDetails);
    }
    getUser()
  });
  const uploadProgress = (ProgressEvent) => {
    console.log(ProgressEvent.total);
    setProgress(.75);
  };
  const createNewPost = async () => {
    let userDetails = user;
    let token = await AsyncStorage.getItem("token") + "-" + CREATE_NEW_POST_SHORT + "-" + getEncTokenAnyUserId(userDetails.userId);
    axios.post(NEW_POST,{
      "userId": getEncUserId(userDetails.userId),
      "title": post.title,
      "myName": userDetails.firstName,
      "selectionType": 1,
      "url": "", 
      "imageUrl": post.imageUrl,
      "videoUrl": post.videoUrl,
      "placeName": "",
      "postLat": "",
      "postLng": "",
      "currentLat": "",
      "currentLng": "",
      "categoryName": "",
      "categoryIcon": "",
      "address": "",
      //"userList": userList,
      //"continent": continent,
      "country": userDetails.countryName,
      "city": userDetails.mmCity,
      "state": userDetails.mmState,
      "deviceType": "android",
    },{
      headers:{
        token: token
      }
    }).then(res=>{
      console.log(JSON.stringify(res.data))
      //navigation.push('Sidenav')
    })
  };
  const uploadVideo = (file) => {
    let formdata = new FormData();
    formdata.append('video', {
      name: "video",
      type: file.type,
      uri: file.uri
    });
    axios.post(UPLOAD_VIDEO, formdata, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
      onUploadProgress: uploadProgress
    }).then(res => {
      //alert(JSON.stringify(res.data.response.imageUrl ))
      setPost(post=>{return {...post, imageUrl: res.data.response.imageUrl}})
    }, err => {
      console.log(err)
    })
  };
  const uploadFile = (file) => {
    let formdata = new FormData();
    formdata.append('image', {
      name: "image",
      type: file.type,
      uri: file.uri
    });
    axios.post(UPLOAD_IMG, formdata, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
      onUploadProgress: uploadProgress
    }).then(res => {
      //alert(JSON.stringify(res.data.response.imageUrl ))
      setPost(post=>{return {...post, imageUrl: res.data.response.imageUrl}})
    }, err => {
      console.log(err)
    })
  };
  const handlePress = async (type) => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          'title': 'Access Storage',
          'message': 'Access Storage for the pictures'
        }
      )
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use read from the storage")
      } else {
        console.log("Storage permission denied")
      }
    } catch (err) {
      console.warn(err)
    }
    var options = {
      title: 'Select Image',
      customButtons: [
        {
          name: 'customOptionKey',
          title: 'Choose file from Custom Option'
        },
      ],
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };
    options = type === 'video'? {...options, mediaType: type}: options,
    launchImageLibrary(options, res => {
      console.log('Response = ', res);
      if (res.didCancel) {
        console.log('User cancelled image picker');
      } else if (res.error) {
        console.log('ImagePicker Error: ', res.error);
      } else if (res.customButton) {
        console.log('User tapped custom button: ', res.customButton);
        alert(res.customButton);
      } else {
        let source = res;
        console.log('response', JSON.stringify(res));
        if(type==='video') uploadVideo(res.assets[0]);
        else uploadFile(res.assets[0]);
      }
    });
  };
  const handleCameraRoll = () => {
    let options = {
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };
    launchCamera(options, (res) => {
      console.log('Response = ', res);
      if (res.didCancel) {
        console.log('User cancelled image picker');
      } else if (res.error) {
        console.log('ImagePicker Error: ', res.error);
      } else if (res.customButton) {
        console.log('User tapped custom button: ', res.customButton);
        alert(res.customButton);
      } else {
        const source = { uri: res.uri };
        console.log('response', JSON.stringify(res));
        uploadFile(res.assets[0]);
      }
    });
  };
  return (
    <>
      <View style={styles.postBox}>
        <View style={styles.postBoxHead}>
          <View style={styles.postBoxImgWrap}>
            <Image
              resizeMode="cover"
              source={require('../assets/images/avatar.jpg')}
              style={[styles.postBoxImg]}
            />
          </View>

          <Text style={styles.listInfoTitle}>{user && user.firstName}</Text>
        </View>

        {progress>0 && !post?.imageUrl &&
        
        <Modal
            animationType="slide"
            transparent={true}
            visible={true}
          >
            <View style={styles.centeredViewInner}>
              <View style={styles.modalView}>
                
                <Progress.Pie progress={progress} size={50} color='grey' />


              
              </View>
            </View>
          </Modal>}

        {post && post.imageUrl && (<View style={styles.addPhotoWrap}>
            <Image
              style={styles.eventImg}
              source={{
                uri: 'https://cdn.lykapp.com/newsImages/images/' + post.imageUrl
              }}
            />
          </View>)}

        <View style={styles.postBody}>
          <TextInput
            placeholderTextColor="#AFAFAF"
            style={styles.input}
            placeholder="Type your update here"
            textContentType="username"
            underlineColorAndroid="transparent"
            multiline={true}
            numberOfLines={10}
            onChangeText={(e)=>setPost(post=>{return {...post, title: e}})}
          />
        </View>
      </View>

      <View style={styles.postBoxOptions}>
        <View style={styles.postBoxShareOptions}>
          <TouchableOpacity style={styles.shareOptions}>
            <IonIcon name="ios-earth-outline" size={25} color={COLORS.blue} />
            <Text style={[styles.shareOptionsText, styles.active]}>Public</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOptions}>
            <IonIcon name="ios-people-outline" size={25} color="#abacb1" />
            <Text style={styles.shareOptionsText}>My Connec..</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOptions}>
            <IonIcon name="ios-people-outline" size={25} color="#abacb1" />
            <Text style={styles.shareOptionsText}>My Family</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.morePostTools}>
          <TouchableOpacity style={styles.morePostToolsItem} onPress={()=>handlePress('image')}>
            <IonIcon name="image-outline" size={25} color="#abacb1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.morePostToolsItem} onPress={handleCameraRoll}>
            <FIcon name="camera" size={25} color="#abacb1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.morePostToolsItem} onPress={()=>handlePress('video')}>
            <FIcon name="video" size={25} color="#abacb1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.morePostToolsItem}>
            <FIcon name="map-pin" size={25} color="#abacb1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.morePostToolsItem} onPress={()=>navigation.push('Addevent')}>
            <FIcon name="calendar" size={25} color="#abacb1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.morePostToolsItem}>
            <FIcon name="smile" size={25} color="#abacb1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.morePostToolsItem}>
            <Text style={styles.goLiveText}>Go Live</Text>
          </TouchableOpacity>
          {(post?.imageUrl?.length>0 || post?.videoUrl?.length>0 || post?.title?.length>0) && (<TouchableOpacity style={styles.chatSendBt} onPress={createNewPost}>
            <IonIcon name="send" size={24} color="#fff" />
          </TouchableOpacity>)}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  addPhotoWrap: {
    backgroundColor: '#dbe0e6',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventImg: {
    width: '100%',
    height: '100%',
  },
  active: {
    color: COLORS.blue
  },
  postBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
  },
  postBoxImgWrap: {
    width: 50,
    height: 50,
    borderRadius: 100,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postBoxHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  postBoxImg: {
    width: '100%',
    height: '100%',
  },
  listInfoTitle: {
    fontSize: 16,
    fontFamily: 'SFpro-Bold',
    color: '#333436',
    marginLeft: 15,
  },
  input: {
    //height:18
    textAlignVertical: 'top',
    alignItems: 'flex-start',
  },
  postBoxShareOptions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  postBoxOptions: {
    backgroundColor: '#fff',
    padding: 15,
  },
  shareOptions: {
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#f6f7f9',
    height: 44,
    borderRadius: 100,

    paddingHorizontal: 8,
  },
  shareOptionsText: {
    color: '#7f8289',
    fontFamily: 'SFpro-Regular',
    marginLeft: 5,
    fontSize: 13,
  },
  morePostToolsItem: {
    marginRight: 15
  },
  morePostTools: {
    marginTop: 30,
    alignItems: 'center',
    flexDirection: 'row',

  },
  goLiveText: {
    color: COLORS.blue,
    fontFamily: 'SFpro-Bold',
    textTransform: 'uppercase'

  },
  chatSendBt: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredViewInner: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    height: '100%',
    justifyContent: 'center',
  },
  modalView: {
    paddingTop: 30,
    width: '70%',
    paddingHorizontal: 55,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderRadius: 32,
    borderBottomStartRadius: 0,
    borderBottomEndRadius: 0,
    overflow: 'hidden',
    alignSelf: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  linearGradient: {
    padding: 35,
    width: '100%',
  },
  msg:{
    fontSize: 15,
    fontFamily: 'SFpro-Regular',
    textAlign: 'center',
    marginBottom:25
  }
});
