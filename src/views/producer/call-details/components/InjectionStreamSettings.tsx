import React, { useEffect, useReducer, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useDispatch, useSelector } from "react-redux";
import AppState from "@/stores/AppState";
import {
  Checkbox,
  Flex,
  Text,
  Form,
  RadioGroup,
  Input,
  Button,
  RedoIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardCopiedToIcon,
} from "@fluentui/react-northstar";
import {
  NewInjectionStream,
  StreamMode,
  StreamProtocol,
} from "@/models/calls/types";
import {
  refreshStreamKeyAsync,
  startInjectionAsync,
} from "@/stores/calls/private-call/asyncActions";
import { closeNewInjectionStreamSettings } from "@/stores/calls/private-call/actions";
import { PrivateCall } from "@/models/calls/types";

interface SettingsState {
  protocol?: StreamProtocol;
  injectionUrl?: string;
  streamMode?: StreamMode;
  latency?: number;
  passphrase?: string;
  enableSsl?: boolean;
}

const DEFAULT_LATENCY = 750;
const OBFUSCATION_PATTERN = "********";

const InjectionStreamSettings: React.FC = () => {
  const [showStreamKey, setShowStreamKey] = useState(false);
  const dispatch = useDispatch();
  const activeCall = useSelector(
    (state: AppState) => state.privateCall.activeCall
  );
  const newStream = useSelector(
    (state: AppState) => state.privateCall.newInjectionStream
  );

  //Warning! It wasn't tested with nested objects
  const [state, setState] = useReducer(
    (state: SettingsState, newState: Partial<SettingsState>) => ({
      ...state,
      ...newState,
    }),
    {}
  );

  const visible = !!newStream;
  const rtmpPushStreamKey = activeCall?.privateContext?.streamKey ?? "";
  const rtmpPushStreamUrl = getRtmpPushStreamUrl(
    activeCall!,
    !!state.enableSsl
  );

  const loadDefaultSettings = () => {
    const protocol = newStream?.protocol || StreamProtocol.SRT;
    const streamMode = newStream?.mode || StreamMode.Caller;
    const latency = newStream?.latency || DEFAULT_LATENCY;
    const enableSsl = !!newStream?.enableSsl;
    setState({ protocol, streamMode, latency, enableSsl });
  };

  const handleClose = () => {
    dispatch(closeNewInjectionStreamSettings());
  };

  const handlerefreshStreamKey = () => {
    dispatch(refreshStreamKeyAsync(activeCall!.id));
  };

  const handleSave = () => {
    if (!newStream) {
      return;
    }
    const newInjectionStream: NewInjectionStream = {
      callId: newStream.callId,
      streamUrl: state.injectionUrl,
      streamKey: state.passphrase,
      protocol: state.protocol || StreamProtocol.SRT,
      mode: state.streamMode || StreamMode.Caller,
      latency: state.latency,
      enableSsl: state.enableSsl,
    };

    dispatch(startInjectionAsync(newInjectionStream));
  };

  useEffect(() => {
    loadDefaultSettings();
  }, []);

  return (
    <Flex gap="gap.small" column>
      <Form>
        <Text
          size="larger"
          weight="bold"
          content="Record"
          style={{ marginBottom: 0 }}
        />

        {state.protocol !== undefined && (
          <Text size="large">
            Injection over <strong>{StreamProtocol[state.protocol]}</strong>
          </Text>
        )}

        <Flex column gap="gap.small">
          <Text weight="bold" content="Settings" />
          Protocol
          <RadioGroup
            checkedValue={state.protocol}
            onCheckedValueChange={(e, data) =>
              setState({ protocol: data?.value as StreamProtocol })
            }
            items={[
              {
                name: "SRT",
                key: "SRT",
                label: "SRT",
                value: StreamProtocol.SRT,
              },
              {
                name: "RTMP",
                key: "RTMP",
                label: "RTMP",
                value: StreamProtocol.RTMP,
              },
            ]}
          />
          Mode
          <RadioGroup
            checkedValue={state.streamMode}
            onCheckedValueChange={(e, data) =>
              setState({ streamMode: data?.value as StreamMode })
            }
            items={[
              {
                name: "pullOrCaller",
                key: "pullOrCaller",
                label:
                  state.protocol === StreamProtocol.SRT ? "Caller" : "Pull",
                value: StreamMode.Caller,
              },
              {
                name: "pushOrListener",
                key: "pushOrListener",
                label:
                  state.protocol === StreamProtocol.SRT ? "Listener" : "Push",
                value: StreamMode.Listener,
              },
            ]}
          />
          {/* In case of SRT Caller mode or RTMP Pull mode render inejction URL */}
          {state.streamMode === StreamMode.Caller && (
            <Input
              name="injectionUrl"
              label="Injection URL"
              value={state.injectionUrl}
              onChange={(event, data) =>
                setState({ injectionUrl: data?.value })
              }
              fluid
            />
          )}
          {/* For RTMP display Enable Ssl property */}
          {state.protocol === StreamProtocol.RTMP &&
            state.streamMode === StreamMode.Listener && (
              <>
                <Checkbox
                  label="Enable Ssl"
                  onChange={(event, data) =>
                    setState({ enableSsl: data?.checked })
                  }
                  toggle
                  labelPosition="start"
                />
                {/* Call Stream Key */}
                <Text>Stream Key</Text>
                <Flex space="between" vAlign="center">
                  <Text>{showStreamKey ? rtmpPushStreamKey : "********"} </Text>
                  <Flex gap="gap.small">
                    <Button
                      circular
                      iconOnly
                      icon={showStreamKey ? <EyeSlashIcon /> : <EyeIcon />}
                      onClick={() => setShowStreamKey((prev) => !prev)}
                    />
                    {/* Refresh Stream Key button */}
                    <Button
                      circular
                      icon={<RedoIcon />}
                      onClick={handlerefreshStreamKey}
                    />
                  </Flex>
                </Flex>

                {/* Stream URL */}
                <Text>Stream Url</Text>
                <Text>
                  {rtmpPushStreamUrl}{" "}
                  <Button circular iconOnly>
                    <CopyToClipboard
                      text={rtmpPushStreamUrl.replace(
                        OBFUSCATION_PATTERN,
                        rtmpPushStreamKey
                      )}
                    >
                      <ClipboardCopiedToIcon />
                    </CopyToClipboard>
                  </Button>
                </Text>
              </>
            )}
          {/* For SRT display the Latency and Passphrase properties */}
          {state.protocol === StreamProtocol.SRT && (
            <>
              <Input
                name="latency"
                label="Latency"
                type="number"
                defaultValue="750"
                value={state.latency}
                onChange={(event, data) =>
                  setState({ latency: parseInt(data?.value || "0", 10) })
                }
                fluid
              />
              <Input
                name="passphrase"
                label="Passphrase"
                value={state.passphrase}
                onChange={(event, data) =>
                  setState({ passphrase: data?.value })
                }
                fluid
              />
            </>
          )}
        </Flex>

        <Flex gap="gap.smaller" space="between">
          <Button
            onClick={handleClose}
            content="Cancel"
            secondary
            loader="Back up bus"
          />
          <Button
            onClick={handleSave}
            content="Start"
            primary
            loader="Back up bus"
          />
        </Flex>
      </Form>
    </Flex>
  );
};

const getRtmpPushStreamUrl = (
  call: PrivateCall,
  enableSsl: boolean
): string => {
  let protocol = "rtmp";
  let port = 1936;

  if (enableSsl) {
    protocol = "rtmps";
    port = 2936;
  }

  if (call && call.botFqdn) {
    const domain = call.botFqdn.split(":")[0];
    return `${protocol}://${domain}:${port}/${OBFUSCATION_PATTERN}?callId=${call?.id}`;
  }

  return "";
};

export default InjectionStreamSettings;