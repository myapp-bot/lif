package app.lifeos.premium;

import android.os.Bundle;
import android.graphics.Color;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.Button;
import android.widget.TextView;
import androidx.biometric.BiometricManager;
import androidx.activity.OnBackPressedCallback;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

/** Native gate: no HTML flag can dismiss this screen or disable the lock. */
public class MainActivity extends BridgeActivity {
    private LinearLayout shield;
    private boolean unlocked=false, prompting=false;
    public static final int AUTH = BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.DEVICE_CREDENTIAL;
    @Override public void onCreate(Bundle state) {
        registerPlugin(LifeOSNativePlugin.class);
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        shield=new LinearLayout(this);shield.setOrientation(LinearLayout.VERTICAL);shield.setGravity(Gravity.CENTER);shield.setPadding(48,48,48,48);shield.setBackgroundColor(Color.rgb(13,16,32));shield.setClickable(true);shield.setFocusable(true);
        TextView title=new TextView(this);title.setText("LifeOS verrouillé");title.setTextSize(26);title.setTextColor(Color.WHITE);title.setGravity(Gravity.CENTER);shield.addView(title);
        TextView help=new TextView(this);help.setText("Utilise la biométrie ou le code de ton téléphone.");help.setTextColor(Color.LTGRAY);help.setGravity(Gravity.CENTER);help.setPadding(0,24,0,24);shield.addView(help);
        Button retry=new Button(this);retry.setText("Déverrouiller");retry.setOnClickListener(v->unlock());shield.addView(retry);
        addContentView(shield,new android.view.ViewGroup.LayoutParams(-1,-1));
        if(lockEnabled())showShield();else hideShield();
        getOnBackPressedDispatcher().addCallback(this,new OnBackPressedCallback(true){
            @Override public void handleOnBackPressed(){
                if(!isAccessAllowed()){finish();return;}
                getBridge().getWebView().evaluateJavascript("window.lifeosHandleBack ? window.lifeosHandleBack() : false",handled->{if(!"true".equals(handled)){setEnabled(false);getOnBackPressedDispatcher().onBackPressed();setEnabled(true);}});
            }
        });
    }
    public boolean lockEnabled(){return BackupStore.prefs(this).getBoolean("lock",false);}
    public boolean isAccessAllowed(){return !lockEnabled()||unlocked;}
    private void showShield(){unlocked=false;if(shield!=null)shield.setVisibility(View.VISIBLE);if(getBridge()!=null&&getBridge().getWebView()!=null)getBridge().getWebView().setVisibility(View.INVISIBLE);}
    private void hideShield(){unlocked=true;if(shield!=null)shield.setVisibility(View.GONE);if(getBridge()!=null&&getBridge().getWebView()!=null)getBridge().getWebView().setVisibility(View.VISIBLE);}
    @Override public void onResume(){super.onResume();if(lockEnabled()&&!unlocked){showShield();getWindow().getDecorView().post(this::unlock);}}
    @Override public void onPause(){if(lockEnabled())showShield();super.onPause();}
    public void lockNow(){showShield();unlock();}
    public void authenticate(Runnable success,java.util.function.Consumer<String> failure){
        if(prompting){failure.accept("Une authentification est déjà en cours.");return;}
        if(BiometricManager.from(this).canAuthenticate(AUTH)!=BiometricManager.BIOMETRIC_SUCCESS){failure.accept("Configure un verrouillage d’écran dans les réglages Android.");return;}
        prompting=true;
        BiometricPrompt prompt=new BiometricPrompt(this,ContextCompat.getMainExecutor(this),new BiometricPrompt.AuthenticationCallback(){
            @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result){prompting=false;hideShield();success.run();if(getBridge()!=null)getBridge().triggerJSEvent("lifeos-unlocked","window");}
            @Override public void onAuthenticationError(int code,CharSequence error){prompting=false;failure.accept(error.toString());}
        });
        prompt.authenticate(new BiometricPrompt.PromptInfo.Builder().setTitle("Déverrouiller LifeOS").setSubtitle("Biométrie ou code de l’appareil").setAllowedAuthenticators(AUTH).build());
    }
    private void unlock(){if(!lockEnabled()){hideShield();return;}if(prompting||unlocked)return;authenticate(()->{},error->showShield());}
}
