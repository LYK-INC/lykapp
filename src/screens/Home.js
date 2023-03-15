/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prettier/prettier */
import {
  Text,
  View,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Pressable,
  RefreshControl,
} from 'react-native';
import React from 'react';
import {globalStyles} from '../global/globalStyle';
import COLORS from '../global/globalColors';
import messaging from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';

import AntIcon from 'react-native-vector-icons/AntDesign';
import EnIcon from 'react-native-vector-icons/Entypo';
import Footer from '../components/Footer';
import {useEffect} from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-community/async-storage';
import {useState} from 'react';
import {getEncTokenAnyUserId, getEncUserId} from '../shared/encryption';
import moment from 'moment';
import Header from '../components/Header';
import Animated, {
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import HomeComments from '../components/HomeComments';
import ThreeDotComponent from '../components/threeDot';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useContext} from 'react';
import {HomeContext} from '../shared/homeFeedCotext';

export const API_URL =
  process.env.API_URL || 'https://api.lykapp.com/lykjwt/index.php?/';
export const HOME_FEED = `${API_URL}/TimelineNew/getFeed_V_2`;
export const INSERT_PUSH = `${API_URL}/LYKPush/insertPush`;
export const INAPPROPRIATE_URL = `${API_URL}Analytical/reportItem`;

export const INSERT_PUSH_SHORT = 'isrPs';
const HOME_FEED_SHORT = 'gttmln';
const offset = 0,
  limit = 25,
  feedPosition = -1,
  oddOffset = 0,
  evenOffset = 0,
  isStatic = 0,
  isEven = 0,
  birthdayStartPosition = 0,
  size = 0;
const pId = null,
  activityFriendOffsetCount = '0',
  nextPostId = '0',
  promoId = '0',
  nextNewsId = '0',
  postStatus = '0';
export default function Home() {
  const navigation = useNavigation();
  const translateY = useSharedValue(0);
  const lastContentOffset = useSharedValue(0);
  const isScrolling = useSharedValue(false);
  const [refresh, setRefresh] = useState(false);
  const [isScrollDown, setScrollDown] = useState(false);
  const [threeDot, setThreeDot] = useState(false);
  const [threeDotData, setThreeDotData] = useState({});
  const {feeds, setFeeds} = useContext(HomeContext);
  useEffect(() => {
    async function getHomeFeed() {
      let userDetails = await AsyncStorage.getItem('userId');
      userDetails = JSON.parse(userDetails);
      let token =
        (await AsyncStorage.getItem('token')) +
        '-' +
        HOME_FEED_SHORT +
        '-' +
        getEncTokenAnyUserId(userDetails.userId);
      axios
        .post(
          HOME_FEED,
          {
            userId: getEncUserId(userDetails.userId),
            limit: limit,
            country: userDetails.countryName,
            offset: offset,
            nextPostId: nextPostId,
            pId: pId,
            promoId: promoId,
            deviceType: 'android',
            apiVersion: 2,
            nextNewsId: nextNewsId,
            postStatus: postStatus,
            activityFriendOffsetCount: activityFriendOffsetCount,
          },
          {
            headers: {
              token: token,
            },
          },
        )
        .then(
          res => {
            //alert(JSON.stringify(res.data.response.feeds) + token + userDetails.userId)
            setFeeds(res.data.response.feeds);
            setRefresh(false);
          },
          err => {
            alert(err + userDetails.userId + token);
          },
        );
    }
    getHomeFeed();
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      //Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
      if (remoteMessage.data.type === 'startcall') {
        navigation.push('Callscreen', {
          toUserId: remoteMessage.data.fromUserId,
          userName: remoteMessage.data.incomingCallerName,
          isCalling: true,
        });
      }
    });

    return unsubscribe;
  }, [refresh]);
  async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
  }
  const wait = timeout => {
    return new Promise(resolve => setTimeout(resolve, timeout));
  };

  const onRefresh = React.useCallback(() => {
    console.log('sdfds');
    setRefresh(prev => !prev);
    // wait(2000).then(() => setRefresh(false));
  }, []);
  useEffect(() => {
    async function userInfo() {
      let userDetails = await AsyncStorage.getItem('userId');
      userDetails = JSON.parse(userDetails);
      if (userDetails) {
        let token =
          (await AsyncStorage.getItem('token')) +
          '-' +
          INSERT_PUSH_SHORT +
          '-' +
          getEncTokenAnyUserId(userDetails.userId);
        if (requestUserPermission()) {
          messaging()
            .getToken()
            .then(FCMtoken => {
              console.log('token>>>>' + FCMtoken);
              axios
                .post(
                  INSERT_PUSH,
                  {
                    userId: getEncUserId(userDetails.userId),
                    pushKeyString: FCMtoken,
                    deviceType: 'android',
                    deviceId: DeviceInfo.getDeviceId(),
                  },
                  {
                    headers: {
                      token: token,
                    },
                  },
                )
                .then(() => {});
            });
        }
      }
    }
    userInfo();

    // Assume a message-notification contains a "type" property in the data payload of the screen to open

    messaging().onNotificationOpenedApp(async remoteMessage => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage.notification,
      );
    });

    // Check whether an initial notification is available
    messaging()
      .getInitialNotification()
      .then(async remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage.notification,
          );
        }
      });

    // Register background handler
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });

    /* const unsubscribe = messaging().onMessage(async remoteMessage => {
        Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
      });
  
      return unsubscribe; */
  }, []);
  const actionBarStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(translateY.value, {
            duration: 750,
            easing: Easing.inOut(Easing.ease),
          }),
        },
      ],
    };
  });
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      if (
        lastContentOffset.value > event.contentOffset.y &&
        isScrolling.value
      ) {
        translateY.value = 0;

        // console.log('scrolling up');
      } else if (
        lastContentOffset.value < event.contentOffset.y &&
        isScrolling.value
      ) {
        translateY.value = 100;
        // console.log('scrolling down');
      }
      lastContentOffset.value = event.contentOffset.y;
    },
    onBeginDrag: e => {
      isScrolling.value = true;
    },
    onEndDrag: e => {
      isScrolling.value = false;
    },
  });
  const onRedirectCommentScreen = ({details, type}) => {
    navigation.push('comments', {
      details: details,
      styles: styles,
      type: type,
    });
  };
  moment.updateLocale('en', {
    relativeTime: {
      future: 'in %s',
      past: '%s ago',
      s: 'a few seconds',
      ss: '%d seconds',
      m: 'a minute',
      mm: '%d minutes',
      h: '1 hrs ago',
      hh: '%d hrs ago',
      d: 'a day',
      dd: '%d days',
      M: 'a month',
      MM: '%d months',
      y: 'a year',
      yy: '%d years',
    },
  });
  // console.log(feeds);
  const onPressThreeDot = ({type, feedId, title, imageUrl}) => {
    setThreeDotData({type, feedId, title, imageUrl});
    setThreeDot(true);
  };
  console.log(feeds);
  return (
    <>
      <Header onSetRefresh={onRefresh} />
      {threeDot && (
        <ThreeDotComponent
          onClose={() => setThreeDot(false)}
          type={threeDotData.type}
          feedId={threeDotData.feedId}
          imageUrl={threeDotData.imageUrl}
          title={threeDotData.title}
          setFeeds={setFeeds}
        />
      )}
      <View style={globalStyles.innerPagesContainer}>
        <Animated.ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refresh} onRefresh={() => onRefresh} />
          }
          bounces={false}
          onScroll={scrollHandler}>
          <View style={styles.blueBar} />
          <View style={styles.postInvitedNetwork}>
            <TouchableOpacity
              onPress={() => {
                navigation.push('Createpost');
              }}>
              <Image
                resizeMode="contain"
                source={require('../assets/images/create-post.png')}
                style={[styles.postImg]}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Image
                resizeMode="contain"
                source={require('../assets/images/invited.png')}
                style={[styles.postImg]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigation.push('network');
              }}>
              <Image
                resizeMode="contain"
                source={require('../assets/images/grow-network.png')}
                style={[styles.postImg]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.newsCardsWrap}>
            {feeds.map(({type, details}) =>
              type === 'news' ? (
                <Pressable
                  style={styles.newsCard}
                  key={details.newsId}
                  onPress={() => onRedirectCommentScreen({details, type})}>
                  <View style={styles.cardTitle}>
                    <View style={styles.cardProImg}>
                      <Image
                        resizeMode="contain"
                        source={require('../assets/images/logo.png')}
                        style={[styles.logoImg]}
                      />
                    </View>
                    <View style={styles.newstext}>
                      <Text style={styles.newsTitletext}>News & Stories</Text>
                      <Text style={styles.newsSubTitletext}>
                        {moment(new Date()).diff(
                          moment(details.feedTime.replace(' ', 'T') + 'Z'),
                          'days',
                        ) < 1
                          ? moment(
                              details.feedTime.replace(' ', 'T') + 'Z',
                            ).fromNow('past')
                          : moment(
                              details.feedTime.replace(' ', 'T') + 'Z',
                            ).format('DD MMM YYYY, h:mm a')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.options}
                      onPress={() =>
                        onPressThreeDot({
                          type,
                          feedId: details.newsId,
                          title: details.newsTitle,
                          imageUrl: details.newsImageUrl,
                          setFeeds: setFeeds,
                        })
                      }>
                      <EnIcon
                        name="dots-three-horizontal"
                        size={25}
                        color="#333"
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.mainDesc}>{details.newsTitle}</Text>

                  <View style={styles.newsCoverImg}>
                    <Image
                      resizeMode="stretch"
                      source={{
                        uri: details.newsImageUrl,
                      }}
                      style={[styles.postImg]}
                    />
                  </View>
                  <Text style={styles.secDesc}>{details.newsDescription}</Text>

                  <View style={styles.likeCommentShare}>
                    <View style={styles.likeCommentShareBox}>
                      <View style={styles.likeCommentShareIconWrap}>
                        <Image
                          resizeMode="contain"
                          source={require('../assets/images/liked.png')}
                          style={[styles.likeImg]}
                        />
                        {/* <TouchableOpacity style={styles.roundBase}>
                        <AntIcon name={details.myLike ? "like1" : "like2"} size={22} color="#9c9d9f" />
                      </TouchableOpacity> */}

                        <Text style={styles.iconText}>
                          {details.likeCount} Like
                        </Text>
                      </View>
                    </View>

                    <View style={styles.likeCommentShareBox}>
                      <TouchableOpacity
                        style={styles.likeCommentShareIconWrap}
                        onPress={() =>
                          onRedirectCommentScreen({details, type})
                        }>
                        {/* <TouchableOpacity style={styles.roundBase}>
                        <AntIcon name="message1" size={22} color="#c1cb99" />
                      </TouchableOpacity> */}
                        <Image
                          resizeMode="contain"
                          source={require('../assets/images/comment.png')}
                          style={[styles.likeImg]}
                        />

                        <Text style={styles.iconText}>
                          {details.commentCount} Comment
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Menu>
                      <MenuTrigger>
                        <View style={styles.likeCommentShareBox}>
                          <View style={styles.likeCommentShareIconWrap}>
                            <Image
                              resizeMode="contain"
                              source={require('../assets/images/share.png')}
                              style={[styles.likeImg]}
                            />

                            <Text style={styles.iconText}>
                              {details.shareCount} Share
                            </Text>
                          </View>
                        </View>
                      </MenuTrigger>
                      <MenuOptions>
                        <MenuOption value={1} text="One" />
                        <MenuOption value={2}>
                          <Text style={{color: 'red'}}>Two</Text>
                        </MenuOption>
                        <MenuOption value={3} disabled={true} text="Three" />
                      </MenuOptions>
                    </Menu>
                  </View>
                  {details.allComments?.map((comment, ind) => (
                    <HomeComments commentDetails={comment} key={ind} />
                  ))}

                  <View style={styles.addCommentWrap}>
                    <View style={styles.addCommentImgWrap}>
                      <Image
                        resizeMode="stretch"
                        source={require('../assets/images/avatar.jpg')}
                        style={[styles.addCommentImg]}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.addCommentField}
                      onPress={() => onRedirectCommentScreen({type, details})}>
                      <TextInput
                        placeholderTextColor="#AFAFAF"
                        style={styles.input}
                        editable={false}
                        placeholder="Add comment"
                        textContentType="username"
                        underlineColorAndroid="transparent"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </TouchableOpacity>
                  </View>
                </Pressable>
              ) : (
                type === 'post' && (
                  <Pressable style={styles.newsCard} key={details.postId}>
                    <View style={styles.cardTitle}>
                      <View style={styles.cardProImg}>
                        <Image
                          resizeMode="contain"
                          source={require('../assets/images/avatar.jpg')}
                          style={[styles.logoImg]}
                        />
                      </View>
                      <View style={styles.newstext}>
                        <Text style={styles.newsTitletext}>
                          {details.createdBy.firstName}
                        </Text>
                        <Text style={styles.newsSubTitletext}>
                          {moment(new Date()).diff(
                            moment(details.createdOn.replace(' ', 'T') + 'Z'),
                            'days',
                          ) < 1
                            ? moment(
                                details.createdOn.replace(' ', 'T') + 'Z',
                              ).fromNow('past')
                            : moment(
                                details.createdOn.replace(' ', 'T') + 'Z',
                              ).format('DD MMM YYYY, h:mm a')}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.options}
                        onPress={() =>
                          onPressThreeDot({
                            type,
                            title: details.title,

                            feedId: details.postId,
                            imageUrl: details.imageUrl,
                          })
                        }>
                        <EnIcon
                          name="dots-three-horizontal"
                          size={25}
                          color="#333"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* <Text style={styles.mainDesc}>
                  {details.title}
                </Text> */}

                    {details.imageUrl && (
                      <View style={styles.newsCoverImg}>
                        <Image
                          resizeMode="stretch"
                          source={{
                            uri:
                              'https://cdn.lykapp.com/newsImages/images/' +
                              details.imageUrl,
                          }}
                          style={[styles.postImg]}
                        />
                      </View>
                    )}
                    <Text style={styles.secDesc}>{details.title}</Text>

                    <View style={styles.likeCommentShare}>
                      <View style={styles.likeCommentShareBox}>
                        <View style={styles.likeCommentShareIconWrap}>
                          <Image
                            resizeMode="contain"
                            source={require('../assets/images/liked.png')}
                            style={[styles.likeImg]}
                          />

                          {/* <TouchableOpacity style={styles.roundBase}>
                          <AntIcon name={details.myLike ? "like1" : "like2"} size={22} color="#9c9d9f" />
                        </TouchableOpacity> */}

                          <Text style={styles.iconText}>
                            {details.likeCount} Like
                          </Text>
                        </View>
                      </View>

                      <View style={styles.likeCommentShareBox}>
                        <TouchableOpacity
                          onPress={() =>
                            onRedirectCommentScreen({details, type})
                          }
                          style={styles.likeCommentShareIconWrap}>
                          {/* <TouchableOpacity style={styles.roundBase}>
                          <AntIcon name="message1" size={22} color="#c1cb99" />
                        </TouchableOpacity> */}
                          <Image
                            resizeMode="contain"
                            source={require('../assets/images/comment.png')}
                            style={[styles.likeImg]}
                          />

                          <Text style={styles.iconText}>
                            {details.commentCount} Comment
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.likeCommentShareBox}>
                        <View style={styles.likeCommentShareIconWrap}>
                          {/* <TouchableOpacity style={styles.roundBase}>
                          <AntIcon name="sharealt" size={22} color="#f8767a" />
                        </TouchableOpacity> */}
                          <Image
                            resizeMode="contain"
                            source={require('../assets/images/share.png')}
                            style={[styles.likeImg]}
                          />

                          <Text style={styles.iconText}>
                            {details.shareCount} Share
                          </Text>
                        </View>
                      </View>
                    </View>
                    {details.allComments?.map((comment, ind) => (
                      <HomeComments commentDetails={comment} key={ind} />
                    ))}
                    <View style={styles.addCommentWrap}>
                      <View style={styles.addCommentImgWrap}>
                        <Image
                          resizeMode="stretch"
                          source={require('../assets/images/avatar.jpg')}
                          style={[styles.addCommentImg]}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.addCommentField}
                        onPress={() =>
                          onRedirectCommentScreen({details, type})
                        }>
                        <TextInput
                          placeholderTextColor="#AFAFAF"
                          style={styles.input}
                          editable={false}
                          disableFullscreenUI={true}
                        />
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                )
              ),
            )}
          </View>
        </Animated.ScrollView>
        <Footer style={actionBarStyle} navigation={navigation} />
      </View>

      {/* <Animated.View style={actionBarStyle}> */}
      {/* </Animated.View> */}
    </>
  );
}

const styles = StyleSheet.create({
  blueBar: {
    height: 40,
    width: '100%',
    backgroundColor: COLORS.blue,
  },
  postInvitedNetwork: {
    flex: 1,
    height: '100%',
    // backgroundColor: 'red',
    paddingHorizontal: 15,
    marginTop: -35,
  },
  postImg: {
    width: '100%',
    height: 260,
    marginBottom: 15,
  },
  newsCardsWrap: {
    padding: 15,
  },
  cardProImg: {
    width: 50,
    height: 50,
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  newstext: {
    marginLeft: 15,
  },
  newsTitletext: {
    textTransform: 'capitalize',
    fontWeight: '500',
    color: '#323a42',
    fontFamily: 'SFpro-Medium',
    fontSize: 14,
  },
  newsSubTitletext: {
    color: '#9e9c9c',
    fontSize: 12,
    fontFamily: 'SFpro-Regular',
  },
  scrollView: {
    // flex: 1,
    // height: 'auto',
    position: 'relative',
    zIndex: 99,
  },
  options: {
    position: 'absolute',
    right: 15,
    top: 0,
  },
  // newsCardsWrap: {
  //   padding: 15,
  // },
  newsCard: {
    display: 'flex',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 20,
  },
  mainDesc: {
    color: '#333',
    fontFamily: 'SFpro-Regular',
    fontSize: 14,
    paddingHorizontal: 15,
    lineHeight: 20,
  },
  secDesc: {
    color: '#333',
    fontFamily: 'SFpro-Regular',
    fontSize: 14,
    paddingHorizontal: 15,
    lineHeight: 18,
  },
  newsCoverImg: {
    maxHeight: 150,
    overflow: 'hidden',
    alignItems: 'center',
    borderTopColor: '#e7ebf6',
    borderTopWidth: 4,
    borderBottomColor: '#e7ebf6',
    borderBottomWidth: 4,
    marginBottom: 10,
    marginTop: 20,
  },
  likeCommentShare: {
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
    borderTopColor: '#f0f0f0',
    borderTopWidth: 1,
    paddingTop: 2,
    paddingBottom: 2,
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
  },
  likeCommentShareIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconText: {
    color: '#7e868f',
    // marginLeft: 10,
    fontFamily: 'SFpro-Regular',
    fontSize: 12,
    paddingLeft: 5,
  },

  roundBase: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 100,
    borderColor: '#ebebeb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCommentImgWrap: {
    width: 30,
    height: 30,
    borderRadius: 100,
    overflow: 'hidden',
  },
  addCommentImg: {
    width: 30,
    height: 30,
  },
  addCommentWrap: {
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  addCommentField: {
    backgroundColor: '#e7ebf6',
    borderRadius: 8,
    width: '88%',
    paddingHorizontal: 10,
  },
  likeImg: {
    width: 34,
    height: 34,
  },
});
