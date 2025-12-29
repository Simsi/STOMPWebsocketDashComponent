import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Client } from '@stomp/stompjs';

/**
 * ExampleComponent is an example component.
 * It takes a property, `label`, and
 * displays it.
 * It renders an input with the property `value`
 * which is editable by the user.
 */
const STOMPWebsocket = (props) => {
  const {id, setProps, subscribe, send, url, message} = props;
  const clientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const currentTopicRef = useRef('');

  // Initialize STOMP client once when component mounts
  useEffect(() => {
    const stompClient = new Client({
      brokerURL: url,
      reconnectDelay: 5000,
      logRawCommunication: false,
    });

    stompClient.onConnect = () => {
      console.log('STOMP Connected');
      // Subscribe to initial topic if exists
      console.log(currentTopicRef.current)
      if (currentTopicRef.current) {
        subscribeToTopic(currentTopicRef.current);
      }
    };

    stompClient.activate();
    clientRef.current = stompClient;

    return () => {
      stompClient.deactivate();
      console.log('STOMP Disconnected');
    };
  }, []); // Empty dependency array ensures this runs only once

  // Handle subscription changes
  useEffect(() => {
    if (subscribe !== currentTopicRef.current) {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        currentTopicRef.current = null;
        console.log(`Unsubscribed from ${currentTopicRef.current}`);
      }
      
      if (subscribe) {
        subscribeToTopic(subscribe);
      }
    }
  }, [subscribe]);

  // Handle send property changes
  useEffect(() => {
    if (send && clientRef.current?.connected) {
      const { destination, body, headers = {} } = send;
      clientRef.current.publish({
        destination,
        body: JSON.stringify(body),
        headers
      });
      // Reset send property after sending
      setProps({ send: null });
    }
  }, [send]);

  const subscribeToTopic = (topic) => {
    if (clientRef.current?.connected) {
      subscriptionRef.current = clientRef.current.subscribe(
        topic,
        (message) => handleMessage(message)
      );
      currentTopicRef.current = topic;
      console.log(`Subscribed to ${topic}`);
    }
  };

  const handleMessage = (rawMessage) => {
    try {
      const parsedMessage = JSON.parse(rawMessage.body);
      setProps({ message: parsedMessage });
    } catch (error) {
      console.error('Message parsing error:', error);
      setProps({ message: null });
    }
  };

  // Clear message object when message unused
  useEffect(() => {
    return () => {
      if (message) {
        Object.keys(message).forEach(key => delete message[key])
      }
    }
  }, [message]);

  return <div />;
};

STOMPWebsocket.propTypes = {
    /**
     * The url to connect to
     */
    url: PropTypes.string,

    /**
     * The topic to subscribe to.
     */
    subscribe: PropTypes.string,

    /**
     * The message from subscription.
     */
    message: PropTypes.object,

    /**
     * The message to send
     */
    send: PropTypes.object,

    /**
     * The ID used to identify this component in Dash callbacks.
     */
    id: PropTypes.string,

    /**
     * Dash-assigned callback that should be called to report property changes
     * to Dash, to make them available for callbacks.
     */
    setProps: PropTypes.func
};

export default STOMPWebsocket;
