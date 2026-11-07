import javax.swing.*;
import java.awt.*;
import java.awt.event.*;

public class HelloWorld implements ActionListener {
    public static void main(String[] args) {
        // System.out.println("Hello world!");

        JFrame frame = new JFrame("Java starter project:");         // Outline of window, the frame
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(500, 500);
        frame.setLayout(null);                                      // so can move and size components as I want
        frame.setVisible(true);

        JPanel canvas = new JPanel();                               // Attach components to the Jpanel
        canvas.setSize(frame.getWidth(), frame.getHeight());        // fill up the whole JFrame
        canvas.setBackground(new Color(0, 102, 102));
        frame.add(canvas);                                          // attach JPanel to JFrame

        JButton clickMe = new JButton("Click me!");
        clickMe.setFont(new Font("Arial", Font.ITALIC, 36));
        clickMe.setForeground(new Color(255, 0, 0));                // text colour
        clickMe.setBackground(new Color(255, 255, 153));
        clickMe.setBounds(100, 150, 300, 150);                      // (x, y, width, height)
        HelloWorld object = new HelloWorld();                       // Needs done as addActionListener needs non-static object
        clickMe.addActionListener(object);
        frame.add(clickMe);
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        JOptionPane.showMessageDialog(null, "HELLO WORLD!", "Notification", JOptionPane.INFORMATION_MESSAGE);
        
    }
}