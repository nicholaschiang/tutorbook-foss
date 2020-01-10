const functions = require('firebase-functions');
const admin = require('firebase-admin').initializeApp();

const updateHours = require('hours');
const updateSheet = require('sheet');
const SMS = require('sms');
const Algolia = require('algolia');
const Auth = require('auth');
const Data = require('data');
const Notify = require('notifications');
const Payments = require('payments');
const Search = require('search');
const Stats = require('stats');

// ============================================================================
// SEARCH (VIA ALGOLIA) 
// ============================================================================

exports.updateSearch = functions.firestore
    .document('/partitions/{partition}/users/{id}')
    .onWrite(Search.update);

exports.search = functions.https.onRequest(Search.get);

exports.algoliaUserUpdate = functions.firestore
    .document('/partitions/{partition}/users/{id}')
    .onWrite(Algolia.user);

exports.algoliaApptUpdate = functions.firestore
    .document('/partitions/{partition}/locations/{location}/appointments/{id}')
    .onWrite(Algolia.appt);

exports.algoliaActiveApptUpdate = functions.firestore
    .document('/partitions/{partition}/locations/{location}/' +
        'activeAppointments/{id}')
    .onWrite(Algolia.activeAppt);

exports.algoliaPastApptUpdate = functions.firestore
    .document('/partitions/{partition}/locations/{location}/pastAppointments' +
        '/{id}')
    .onWrite(Algolia.pastAppt);

exports.algoliaChatUpdate = functions.firestore
    .document('/partitions/{partition}/chats/{id}')
    .onWrite(Algolia.chat);

// ============================================================================
// PAYMENTS (STRIPE)
// ============================================================================

// 0) Tutor links Stripe Connect account (Function creates stripeAccount doc and 
// sets weekly payouts for every Friday).
exports.initStripeAccount = functions.https.onRequest(Payments.initAccount);

exports.accountURL = functions.https.onRequest(Payments.accountURL);

// 1) Pupil creates request & authPayment doc (Function processes authPayment).
exports.updatePaymentMethods = functions.firestore
    .document('/partitions/{partition}/stripeCustomers/{user}/methods/{method}')
    .onCreate(Payments.addMethod);

exports.processAuthPayment = functions.firestore
    .document('/partitions/{partition}/users/{pupil}/sentPayments/{payment}')
    .onCreate(Payments.processSentPayment);

// 1b) Pupil or tutor cancels request or appt and `data` function deletes 
// authPayment docs.
exports.cancelAuthPayment = functions.firestore
    .document('/partitions/{partition}/users/{user}/authPayments/{payment}')
    .onDelete(Payments.cancelAuthPayment);

// 2) Tutor clocks out & creates creates pastAppt docs (Function creates 
// pendingPayments => asking pupil for payment approval).
exports.askForPaymentApproval = functions.firestore
    .document('/partitions/{partition}/users/{user}/pastAppointments/{appt}')
    .onCreate(Payments.askForPayment);

// 3) Pupil approves payment by creating approvedPayment docs (Function
// processes payment & creates pastPayment docs).
exports.processPayment = functions.firestore
    .document('/partitions/{partition}/users/{user}/approvedPayments/{payment}')
    .onCreate(Payments.processPayment);

exports.increaseBalance = functions.firestore
    .document('/partitions/{partition}/users/{user}/pastPayments/{payment}')
    .onCreate(Payments.updateBalance);

// 4) Tutor requests payout by creating requestedPayout doc (Function sends
// payout & creates pastPayout doc).
exports.processPayout = functions.firestore
    .document('/partitions/{partition}/users/{tutor}/requestedPayouts/{payout}')
    .onCreate(Payments.processPayout);

exports.decreaseBalance = functions.firestore
    .document('/partitions/{partition}/users/{user}/pastPayouts/{payout}')
    .onCreate(Payments.updateBalance);

// 4) Stripe weekly (on Fridays) webhook sends payout (& triggers Function to
// create pastPayout doc).
exports.processWeeklyPayouts = functions.https
    .onRequest(Payments.processWeeklyPayouts);

// ============================================================================
// OTHER
// ============================================================================

exports.getEmailFromPhone = functions.https.onRequest(Search.getEmailFromPhone);

exports.updateSheet = functions.https.onRequest(updateSheet);

// user - When a newUser document is modified, check if they're a verified
// supervisor and if so, ensure that they have customAuth setup
exports.updateCustomAuth = functions.firestore
    .document('/partitions/{partition}/users/{id}')
    .onWrite(Auth.update);

exports.auth = functions.https.onRequest(Auth.custom);

exports.data = functions.https.onRequest(Data.onRequest);

exports.updateHours = functions.firestore
    .document('/partitions/{partition}/users/{user}/pastAppointments/{appt}')
    .onCreate(updateHours);

exports.sms = functions.https.onRequest(SMS.receive());

exports.smsFallback = functions.https.onRequest(SMS.fallback);

exports.userUpdateStat = functions.firestore
    .document('/partitions/{partition}/users/{user}')
    .onWrite(Stats.userUpdate);

// ============================================================================
// NOTIFICATIONS (EMAIL, SMS, & WEBPUSH)
// ============================================================================

exports.apptNotification = functions.https.onRequest(Notify.appt);

exports.apptRulesNotification = functions.firestore
    .document('/partitions/{partition}/locations/{location}/appointments' +
        '/{appt}')
    .onCreate(Notify.rules);

exports.newUserNotification = functions.firestore
    .document('/partitions/{partition}/users/{id}')
    .onCreate(Notify.user);

exports.messageNotification = functions.firestore
    .document('/partitions/{partition}/chats/{chat}/messages/{message}')
    .onCreate(Notify.message);

exports.newChatNotification = functions.firestore
    .document('/partitions/{partition}/chats/{chat}')
    .onCreate(Notify.chat);

exports.feedbackNotification = functions.firestore
    .document('/partitions/{partition}/feedback/{id}')
    .onCreate(Notify.feedback);

// REQUESTs
exports.newRequest = functions.firestore
    .document('/partitions/{partition}/users/{user}/requestsIn/{request}')
    .onCreate(Notify.requestIn);

exports.canceledRequest = functions.firestore
    .document('/partitions/{partition}/users/{user}/canceledRequestsIn' +
        '/{request}')
    .onCreate(Notify.canceledIn);

exports.modifiedRequestIn = functions.firestore
    .document('/partitions/{partition}/users/{user}/modifiedRequestsIn' +
        '/{request}')
    .onCreate(Notify.modifiedIn);

exports.approvedRequest = functions.firestore
    .document('/partitions/{partition}/users/{user}/approvedRequestsOut' +
        '/{request}')
    .onCreate(Notify.approvedOut);

exports.rejectedRequest = functions.firestore
    .document('/partitions/{partition}/users/{user}/rejectedRequestsOut' +
        '/{request}')
    .onCreate(Notify.rejectedOut);

exports.modifiedRequestOut = functions.firestore
    .document('/partitions/{partition}/users/{user}/modifiedRequestsOut' +
        '/{request}')
    .onCreate(Notify.modifiedOut);

// CLOCK-IN/OUTs
exports.clockIn = functions.firestore
    .document('/partitions/{partition}/users/{supervisor}/clockIns/{clockIn}')
    .onCreate(Notify.clockIn);

exports.clockOut = functions.firestore
    .document('/partitions/{partition}/users/{supervisor}/clockOuts/{clockOut}')
    .onCreate(Notify.clockOut);