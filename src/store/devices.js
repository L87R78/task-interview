import { defineStore } from 'pinia';
import { tableLabels, buttons } from '../locales/labels';

import devicesData from '../mockData/devices.json';

export const devices = defineStore({
  id: 'devices',
  state: () => ({
    devicesData,
    jobs: [],
    connectedCables: [],
    availableDevicesData: devicesData
  }),
  actions: {
    connectDevice(selectedDeviceId, device) {
      this.availableDevicesData = this.availableDevicesData.filter(item => (item.id !== selectedDeviceId && item.id !== device.id));

      const selectedDevice = this.devicesData.find(item => item.id === selectedDeviceId);

      if(!selectedDevice) {
        return;
      }

      const updatedDevices = this.devicesData.reduce((acc, current) => {
        if(current.id === device.id) {

          const tempDeviceToJobs = {
            type: 'Connect',
            from: `${current.deviceName}-${current.portName}`,
            to: `${selectedDevice.deviceName}-${selectedDevice.portName}`,
            status: tableLabels.pending,
            action: buttons.complete,
          }
          this.jobs = [ ...this.jobs, tempDeviceToJobs ];

          const tempDevice = current;
          tempDevice.cable = `${current.deviceName}-${current.portName}-${selectedDevice.deviceName}-${selectedDevice.portName}`;
          tempDevice.action = tableLabels.reserved;

          return [ ...acc, tempDevice ];
        } else if (current.id === selectedDeviceId){

          const tempDevice = selectedDevice;
          tempDevice.cable = `${device.deviceName}-${device.portName}-${current.deviceName}-${current.portName}`;
          tempDevice.action = tableLabels.reserved;

          return [ ...acc, tempDevice ];
        } 

        return [ ...acc, current ];

      }, []);
      
      return this.devicesData = updatedDevices;
    },
    disconnectDevice(device) {

      const currentDevice = { ...device };

      const updateDevicesJobs = this.jobs.reduce((acc, current) => {

        if(`${current.from}-${current.to}` === currentDevice.cable) {
          const tempDevice = current;
          tempDevice.status = tableLabels.pending;
          tempDevice.action = buttons.disconnect;

          return [ ...acc, tempDevice ];
        }

        return [ ...acc, current ];
      }, [])

      this.jobs = updateDevicesJobs;

      const updatedDevices = this.devicesData.reduce((acc, current) => {

        if(current.connectedTo === currentDevice.connectedTo) {
          const tempDevice = current;
          tempDevice.connectedTo = null;
          tempDevice.action = tableLabels.reserved;

          return [ ...acc, tempDevice ];

        } else if (current.connectedTo === `${currentDevice.deviceName}-${currentDevice.portName}`){
          const tempDevice = current;
          tempDevice.connectedTo = null;
          tempDevice.action = tableLabels.reserved;

          return [ ...acc, tempDevice ];
        }

        return [ ...acc, current ];

      }, []);

      return this.devicesData = updatedDevices;
    },
    completeDevice(device) {
      this.jobs = this.jobs.reduce((acc, current) => {

        if (current.from === device.from && current.to === device.to && device.action === buttons.disconnect) {
          return [ ...acc]
        } if (current.from === device.from && current.to === device.to) {
          const tempDeviceToJobs = current;
          tempDeviceToJobs.status = tableLabels.completed;

          return [ ...acc, tempDeviceToJobs]
        }

        return [ ...acc, current ];
      }, []);

      this.devicesData = this.devicesData.reduce((acc, current) => {

        if ((current.cable === `${device.from}-${device.to}`) && device.action !== buttons.disconnect) {  
  
          const tempDevice = current;
          tempDevice.connectedTo = `${current.deviceName}-${current.portName}` === device.to ? device.from : device.to;
          tempDevice.action = buttons.disconnect;
          
          return [ ...acc, tempDevice];

        } else if ((current.cable === `${device.from}-${device.to}`) && device.action === buttons.disconnect) {  

          const tempDevice = current;
          tempDevice.connectedTo =  null;
          tempDevice.cable =  null;
          tempDevice.action = 'Connect';
          
          this.availableDevicesData = [ ...this.availableDevicesData, current ]

          return [ ...acc, tempDevice];
        }

        return [ ...acc, current ];
      }, []);

      const tempDataToCable = {
        name: `${device.from}-${device.to}`,
        from: device.from,
        to: device.to
      }

      if(device.action === buttons.disconnect) {
        return this.connectedCables = this.connectedCables.filter(cable => cable.name !== `${device.from}-${device.to}`);
      } else {
        return this.connectedCables = [ ...this.connectedCables, tempDataToCable];
      }
    }
  }
});