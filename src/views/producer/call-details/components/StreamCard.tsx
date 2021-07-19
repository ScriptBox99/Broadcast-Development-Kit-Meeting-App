// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { CopyToClipboard } from "react-copy-to-clipboard";

import {
  Flex,
  Avatar,
  Text,
  Button,
  Divider,
  Card,
  EyeIcon,
  EyeSlashIcon,
} from "@fluentui/react-northstar";
import {
  CallVideoIcon,
  CallVideoOffIcon,
  MicIcon,
  MicOffIcon,
  CallControlShareIcon,
  CallControlStopPresentingNewIcon,
  CallRecordingIcon,
  MoreIcon,
  ClipboardCopiedToIcon,
} from "@fluentui/react-icons-northstar";
import {
  SpecialStreamTypes,
  Stream,
  StreamProtocol,
  StreamState,
  StreamType,
} from "@/models/calls/types";
import { openNewStreamSettings } from "@/stores/calls/private-call/actions/newStreamSettings";
import { stopStreamAsync } from "@/stores/calls/private-call/asyncActions";
import { ApiClient } from "@/services/api";
import { ApiError } from "@/models/error/types";

interface StreamCardProps {
  callId: string;
  stream: Stream;
  isPrimarySpeakerEnabled: boolean;
  isStageEnabled: boolean;
  callProtocol: StreamProtocol;
}

const StreamCard: React.FC<StreamCardProps> = (props) => {
  const dispatch = useDispatch();
  const {
    callId,
    stream,
    isPrimarySpeakerEnabled,
    isStageEnabled,
    callProtocol,
  } = props;

  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded(!expanded);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const toggleShowPassphrase = () => setShowPassphrase(!showPassphrase);
  const [avatartImage, setAvatartImage] = useState("");

  useEffect(() => {
    if (stream.photoUrl) {
      ApiClient.get<any>({
        url: stream.photoUrl,
        shouldOverrideBaseUrl: true,
        config: {
          responseType: "blob",
        },
      }).then((response) => {
        const isError = response instanceof ApiError;
        if (isError) {
          const error = response as ApiError;
          console.error(error.raw);
          return;
        }

        const urlCreator = window.URL || window.webkitURL;
        const imageUrl = urlCreator.createObjectURL(response);
        setAvatartImage(imageUrl);
      });
    }
  }, []);

  const isStreamDisconnected = stream.state === StreamState.Disconnected;

  const toggleStreamOperation = () => {
    if (isStreamDisconnected) {
      dispatch(
        openNewStreamSettings({
          callId: callId,
          streamType: stream.type,
          participantId: stream.id,
          participantName: stream.displayName,
        })
      );
    }

    if (!isStreamDisconnected) {
      dispatch(stopStreamAsync(stream.id));
    }
  };

  const streamOperationEnabled = () => {
    switch (stream.state) {
      case StreamState.Started:
        return true;
      case StreamState.Disconnected:
        switch (stream.type) {
          case StreamType.PrimarySpeaker:
            return isPrimarySpeakerEnabled;
          case StreamType.VbSS:
            return isStageEnabled;
          case StreamType.Participant:
            return stream.isSharingVideo;
        }
      default:
        return false;
    }
  };

  const getPassphraseDisplayValue = (): string => {
    if (stream.details?.passphrase) {
      return showPassphrase ? `${stream.details?.passphrase} ` : "******** ";
    }

    return "None";
  };

  const isSrt = callProtocol === StreamProtocol.SRT;
  const isStreamTypeSpecial = SpecialStreamTypes.includes(stream.type);
  const isStreamOperationEnabled = streamOperationEnabled();

  return (
    <Flex>
      <Card
        ghost
        style={{
          width: "100%",
          paddingLeft: "4px",
          paddingRight: "4px",
        }}
        key={stream.id}
      >
        <Flex
          vAlign="center"
          space="between"
          style={{ display: !expanded ? "flex" : "none" }}
        >
          <Flex vAlign="center" gap="gap.small">
            <Avatar image={avatartImage} name={stream.displayName}></Avatar>
            <Flex column>
              <Text style={{ marginBottom: "0px" }}>{stream.displayName}</Text>
              {!isStreamTypeSpecial && (
                <Flex
                  style={{ marginTop: "4px" }}
                  vAlign="center"
                  gap="gap.small"
                >
                  {stream.isSharingVideo && <CallVideoIcon />}
                  {!stream.isSharingVideo && <CallVideoOffIcon />}
                  {stream.isSharingAudio && !stream.audioMuted && <MicIcon />}
                  {stream.isSharingAudio && stream.audioMuted && <MicOffIcon />}
                  {stream.isSharingScreen && <CallControlShareIcon />}
                  {!stream.isSharingScreen && (
                    <CallControlStopPresentingNewIcon />
                  )}
                </Flex>
              )}
            </Flex>
          </Flex>

          <Flex vAlign="center" gap="gap.smaller">
            <Button
              circular
              icon={
                <CallRecordingIcon
                  style={{
                    color:
                      stream.state === StreamState.Started ? "#E73550" : "",
                  }}
                />
              }
              iconOnly
              onClick={toggleStreamOperation}
              disabled={!isStreamOperationEnabled}
            />

            <Button
              circular
              iconOnly
              icon={<MoreIcon />}
              aria-label="Hover button"
              onClick={toggleExpanded}
            />
          </Flex>
        </Flex>

        {/* Expanded view */}
        <Flex
          style={{ display: expanded ? "flex" : "none" }}
          gap="gap.smaller"
          column
        >
          <Flex gap="gap.small" space="between">
            <Flex column>
              <Text size="large" weight="bold" content={stream.displayName} />

              {!isStreamTypeSpecial && (
                <Flex
                  vAlign="center"
                  gap="gap.small"
                  style={{ paddingTop: "0.25rem" }}
                >
                  {stream.isSharingVideo && <CallVideoIcon />}
                  {!stream.isSharingVideo && <CallVideoOffIcon />}
                  {stream.isSharingAudio && !stream.audioMuted && <MicIcon />}
                  {stream.isSharingAudio && stream.audioMuted && <MicOffIcon />}
                  {stream.isSharingScreen && <CallControlShareIcon />}
                  {!stream.isSharingScreen && (
                    <CallControlStopPresentingNewIcon />
                  )}
                </Flex>
              )}
            </Flex>
            <Flex.Item push>
              <Avatar
                size="larger"
                image={avatartImage}
                name={stream.displayName}
                style={{ cursor: "pointer" }}
                onClick={toggleExpanded}
              />
            </Flex.Item>
          </Flex>

          <Flex>
            <Button
              onClick={toggleStreamOperation}
              disabled={!isStreamOperationEnabled}
            >
              <CallRecordingIcon
                style={{
                  marginRight: "0.25rem",
                  color: stream.state === StreamState.Started ? "#E73550" : "",
                }}
              />
              <Text
                content={
                  stream.state === StreamState.Started ? "Stop" : "Record"
                }
              />
            </Button>
          </Flex>

          <Divider color="gray" fitted style={{ marginTop: "4px" }} />

          {stream.state === StreamState.Started && (
            <Flex column>
              <Text size="large" weight="bold">
                Details
              </Text>

              <Text weight="bold" content="Stream URL:" />

              <Text>
                {stream.details?.streamUrl}{" "}
                <Button circular iconOnly>
                  <CopyToClipboard text={stream.details?.streamUrl}>
                    <ClipboardCopiedToIcon />
                  </CopyToClipboard>
                </Button>
              </Text>

              <Text
                weight="bold"
                content={isSrt ? "Passphrase: " : "Stream Key: "}
              />

              <Text>
                {getPassphraseDisplayValue()}
                {stream.details?.passphrase && (
                  <>
                    <Button circular iconOnly onClick={toggleShowPassphrase}>
                      {showPassphrase ? <EyeSlashIcon /> : <EyeIcon />}
                    </Button>{" "}
                    <Button circular iconOnly>
                      <CopyToClipboard text={stream.details?.passphrase}>
                        <ClipboardCopiedToIcon />
                      </CopyToClipboard>
                    </Button>
                  </>
                )}
              </Text>

              {isSrt && (
                <>
                  <Text weight="bold" content="Latency:" />
                  <Text>{`${stream.details?.latency}ms`}</Text>
                </>
              )}
            </Flex>
          )}
        </Flex>
      </Card>
    </Flex>
  );
};

export default StreamCard;
