package com.sanjuantecnologia.app;

// IMPRESORA TERMICA POR BLUETOOTH.
//
// El ticket ya llega armado en ESC/POS desde la web (src/modules/pos/utils/
// escpos.js): este plugin solo lo entrega. Usa Bluetooth clasico (perfil serie
// SPP), que es lo que hablan las termicas de 58 y 80 mm de mostrador.
//
// Solo trabaja con impresoras YA EMPAREJADAS en Ajustes de Android. Por eso
// alcanza con el permiso BLUETOOTH_CONNECT: no se escanea, y no se pide
// ubicacion. Del lado web: src/app/native/impresoraBluetooth.js.

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.os.Build;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.OutputStream;
import java.util.UUID;

@CapacitorPlugin(
    name = "ImpresoraBluetooth",
    permissions = {
        @Permission(strings = { Manifest.permission.BLUETOOTH_CONNECT }, alias = "bluetooth")
    }
)
public class ImpresoraBluetoothPlugin extends Plugin {

    // Perfil serie (SPP): el estandar de las impresoras termicas.
    private static final UUID SPP = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    // Las termicas baratas pierden bytes si se les manda todo de golpe.
    private static final int TROZO = 512;

    private BluetoothAdapter adaptador() {
        BluetoothManager m = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        return m != null ? m.getAdapter() : null;
    }

    // Android 12 o mas pide BLUETOOTH_CONNECT en tiempo de ejecucion; antes alcanza con el manifest.
    private boolean faltaPermiso() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
            && getPermissionState("bluetooth") != PermissionState.GRANTED;
    }

    @PluginMethod
    public void emparejadas(PluginCall call) {
        if (faltaPermiso()) {
            requestPermissionForAlias("bluetooth", call, "despuesDelPermiso");
            return;
        }
        listar(call);
    }

    @PermissionCallback
    private void despuesDelPermiso(PluginCall call) {
        if (faltaPermiso()) {
            call.reject("Sin permiso de Bluetooth", "SIN_PERMISO");
            return;
        }
        if ("imprimir".equals(call.getMethodName())) imprimirAhora(call);
        else listar(call);
    }

    @SuppressLint("MissingPermission")
    private void listar(PluginCall call) {
        BluetoothAdapter a = adaptador();
        if (a == null) {
            call.reject("Este telefono no tiene Bluetooth", "SIN_BLUETOOTH");
            return;
        }
        if (!a.isEnabled()) {
            call.reject("El Bluetooth esta apagado", "APAGADO");
            return;
        }
        JSArray lista = new JSArray();
        for (BluetoothDevice d : a.getBondedDevices()) {
            JSObject o = new JSObject();
            o.put("nombre", d.getName() != null ? d.getName() : d.getAddress());
            o.put("direccion", d.getAddress());
            lista.put(o);
        }
        JSObject r = new JSObject();
        r.put("impresoras", lista);
        call.resolve(r);
    }

    @PluginMethod
    public void imprimir(PluginCall call) {
        if (faltaPermiso()) {
            requestPermissionForAlias("bluetooth", call, "despuesDelPermiso");
            return;
        }
        imprimirAhora(call);
    }

    @SuppressLint("MissingPermission")
    private void imprimirAhora(PluginCall call) {
        final String direccion = call.getString("direccion");
        final String datos = call.getString("datos");
        if (direccion == null || datos == null) {
            call.reject("Falta la impresora o el ticket", "SIN_DATOS");
            return;
        }
        final BluetoothAdapter a = adaptador();
        if (a == null || !a.isEnabled()) {
            call.reject("El Bluetooth esta apagado", "APAGADO");
            return;
        }
        // Conectar y escribir bloquea: va en otro hilo para no congelar la pantalla.
        new Thread(() -> {
            BluetoothSocket s = null;
            try {
                byte[] bytes = Base64.decode(datos, Base64.DEFAULT);
                BluetoothDevice d = a.getRemoteDevice(direccion);
                a.cancelDiscovery();
                s = d.createRfcommSocketToServiceRecord(SPP);
                s.connect();
                OutputStream out = s.getOutputStream();
                for (int i = 0; i < bytes.length; i += TROZO) {
                    out.write(bytes, i, Math.min(TROZO, bytes.length - i));
                    out.flush();
                    Thread.sleep(20);
                }
                // Margen para que la impresora vacie su buffer antes de cortar el enlace.
                Thread.sleep(300);
                JSObject r = new JSObject();
                r.put("ok", true);
                call.resolve(r);
            } catch (Exception e) {
                call.reject("No se pudo imprimir: " + e.getMessage(), "NO_IMPRIMIO");
            } finally {
                if (s != null) {
                    try { s.close(); } catch (Exception ignorada) { }
                }
            }
        }).start();
    }
}
